// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let process = require('process');
const { execSync } = require('child_process');
let fs = require('fs');
let templatePath = `${__dirname}/../template`;
let inquirer = require('inquirer');
let path = require('path');
const util = require('../lib/util');
let merge = require('merge-package-json');

var packageName;
var visibleName;
var folderName;
var immersive;
var componentsPlatforms;

const askQuestions = () => {
  const questions = [
    {
      name: 'APPNAME',
      type: 'input',
      message: 'What is the name of your application?',
      default: visibleName
    },
    {
      name: 'APPID',
      type: 'input',
      message: 'What is the app ID of your application?',
      validate: util.isValidPackageId,
      default: packageName
    },
    {
      name: 'FOLDERNAME',
      type: 'input',
      message: 'In which folder do you want to save this project?',
      validate: util.isValidFolderName,
      default: folderName
    },
    {
      name: 'APPTYPE',
      type: 'list',
      message: 'What app type do you want?',
      choices: ['Landscape', 'Immersive', 'Components'],
      default: 'Landscape'
    },
    {
      name: 'COMPONENTS_PLATFORM',
      type: 'checkbox',
      message: 'What platform do you want develop on?',
      choices: [
        {
          name: 'Lumin'
        },
        {
          name: 'iOS'
        },
        {
          name: 'Android'
        }],
      when: function (answers) {
        return answers.APPTYPE === 'Components';
      }
    }
  ];
  return inquirer.prompt(questions);
};

function updateManifest (contents) {
  let replaced = contents
    .replace('com.magicleap.magicscript.hello-sample', packageName)
    .replace(new RegExp('MagicScript Hello Sample', 'g'), visibleName);
  if (immersive) {
    replaced = replaced.replace('universe', 'fullscreen')
      .replace('Universe', 'Fullscreen')
      .replace('<uses-privilege ml:name="MagicScript"/>',
        '<uses-privilege ml:name="LowLatencyLightwear"/>\n    <uses-privilege ml:name="MagicScript"/>');
  }
  return replaced;
}

function copyComponentsFiles (srcPath, destPath) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }
  const filesToCreate = fs.readdirSync(srcPath);
  filesToCreate.forEach(file => {
    const origFilePath = `${srcPath}/${file}`;
    const stats = fs.statSync(origFilePath);
    if (stats.isFile()) {
      var contents = fs.readFileSync(origFilePath);
      const writePath = `${destPath}/${file}`;
      fs.writeFileSync(writePath, contents);
    } else if (stats.isDirectory()) {
      let newDestPath = `${destPath}/${file}`;
      copyComponentsFiles(origFilePath, newDestPath);
    }
  });
}

function copyManifest (destPath) {
  let manifestPath = `${destPath}/manifest.xml`;
  if (fs.existsSync(manifestPath)) {
    var contents = fs.readFileSync(manifestPath, 'utf8');
    contents = updateManifest(contents);
    fs.writeFileSync(manifestPath, contents, 'utf8');
  }
}

function copyFiles (srcPath, destPath) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }
  const filesToCreate = fs.readdirSync(srcPath);
  filesToCreate.forEach(file => {
    const origFilePath = `${srcPath}/${file}`;
    const stats = fs.statSync(origFilePath);
    if (stats.isFile()) {
      var contents = fs.readFileSync(origFilePath, 'utf8');
      if (file === 'manifest.xml') {
        contents = updateManifest(contents);
      } else if (immersive && file === 'app.js') {
        contents = contents.replace(new RegExp('LandscapeApp', 'g'), 'ImmersiveApp');
      }
      const writePath = `${destPath}/${file}`;
      fs.writeFileSync(writePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      let newDestPath = `${destPath}/${file}`;
      copyFiles(origFilePath, newDestPath);
    }
  });
}

module.exports = argv => {
  // eslint-disable-next-line no-useless-escape
  let nameRegex = /^([A-Za-z\-\_\d])+$/;
  let idRegex = /^[a-z0-9_]+(\.[a-z0-9_]+)*(-[a-zA-Z0-9]*)?$/i;
  if (argv.visibleName) {
    visibleName = argv.visibleName;
  }
  if (argv.folderName && nameRegex.test(argv.folderName)) {
    folderName = argv.folderName;
    if (!visibleName) {
      visibleName = folderName;
    }
  }
  if (argv.folderName && idRegex.test(argv.packageName)) {
    packageName = argv.packageName;
  }
  if (argv.target && (argv.target.includes('Lumin') || argv.target.includes('iOS') || argv.target.includes('Android'))) {
    componentsPlatforms = argv.target;
  }
  const currentDirectory = process.cwd();
  if (packageName && folderName && argv.targetargv.target[0] === 'Lumin') {
    immersive = argv.immersive;
    copyFiles(templatePath, `${currentDirectory}/${folderName}`);
    return;
  }
  let answerPromise = askQuestions();
  answerPromise.then(answers => {
    packageName = answers['APPID'];
    folderName = answers['FOLDERNAME'];
    visibleName = answers['APPNAME'];
    let appType = answers['APPTYPE'];
    componentsPlatforms = answers['COMPONENTS_PLATFORM'];
    immersive = appType === 'Immersive' || argv.immersive;
    if (appType === 'Components') {
      immersive = false;
      templatePath = path.join(__dirname, '../template_components');
      copyComponentsFiles(templatePath, `${currentDirectory}/${folderName}`);
      copyManifest(`${currentDirectory}/${folderName}`);
      preparePlatforms(`${currentDirectory}/${folderName}`);
      console.log(`Project created for platforms: ${componentsPlatforms}`);
    } else {
      copyFiles(templatePath, `${currentDirectory}/${folderName}`);
      console.log(`Project created for: ${appType}`);
    }
  }).catch(error => console.log(error));
};

function preparePlatforms (destPath) {
  console.log(`prepare platforms: ${componentsPlatforms}`);
  let android = componentsPlatforms.includes('Android');
  let iOS = componentsPlatforms.includes('iOS');
  let lumin = componentsPlatforms.includes('Lumin');
  if (!iOS) {
    if (fs.existsSync(`${destPath}/ios`)) {
      fs.rmdirSync(`${destPath}/ios`, { recursive: true });
    }
  }
  if (!android) {
    if (fs.existsSync(`${destPath}/android`)) {
      fs.rmdirSync(`${destPath}/android`, { recursive: true });
    }
  } else {
    util.createAndroidLocalProperties(destPath);
  }
  if (!lumin) {
    if (fs.existsSync(`${destPath}/lumin`)) {
      fs.rmdirSync(`${destPath}/lumin`, { recursive: true });
    }
  }
  if ((android && iOS && lumin) || (android && lumin) || (iOS && lumin)) {
    var luminPackage = fs.readFileSync(`${destPath}/package.lumin.json`);
    var reactPackage = fs.readFileSync(`${destPath}/package.reactnative.json`);
    fs.writeFileSync(`${destPath}/package.json`, merge(luminPackage, reactPackage));
  } else if ((android && iOS) || android || iOS) {
    fs.renameSync(`${destPath}/package.reactnative.json`, `${destPath}/package.json`);
  } else {
    fs.renameSync(`${destPath}/package.lumin.json`, `${destPath}/package.json`);
  }
  // if (!componentsPlatforms.includes(`Android`) && !componentsPlatforms.includes(`iOS`)) {
  //   if (fs.existsSync(`${destPath}/package.reactnative.json`)) {
  //     fs.unlinkSync(`${destPath}/package.reactnative.json`);
  //   }
  //   fs.renameSync(`${destPath}/package.lumin.json`, `${destPath}/package.json`);
  // } else if (!componentsPlatforms.includes('Lumin')) {
  //     var luminPackage = fs.readFileSync(`${destPath}/package.lumin.json`);
  //     var updateReactPackage = fs.readFileSync(`${destPath}/package.reactnative.json`);
  //     fs.writeFileSync(`${destPath}/package.json`, merge(luminPackage, updateReactPackage));
  //   } else {
  //     fs.renameSync(`${destPath}/package.reactnative.json}`, `${destPath}/package.json`);
  //   }
  // }
  removePackageJsons(destPath);
}

function removePackageJsons (destPath) {
  if (fs.existsSync(`${destPath}/package.lumin.json`)) {
    fs.unlinkSync(`${destPath}/package.lumin.json`);
  }
  if (fs.existsSync(`${destPath}/package.reactnative.json`)) {
    fs.unlinkSync(`${destPath}/package.reactnative.json`);
  }
}
