// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let process = require('process');
let fs = require('fs');
let templatePath = `${__dirname}/../template`;
let inquirer = require('inquirer');
let path = require('path');
const util = require('../lib/util');
const reactFiles = ['.buckconfig', '.eslintrc.js', '.flowconfig', '.gitattributes', '.prettierrc.js', '.watchmanconfig', 'app.json', 'babel.config.js', 'metro.config.js'];
const luminFiles = ['.babelrc', 'app.mabu', 'app.package', 'lr_resource_locator', 'manifest.xml', 'rollup.config.js', 'tsconfig.js'];
const targetPlatforms = ['IOS', 'ANDROID', 'LUMIN'];
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const normal = '\x1b[0m';

var packageName;
var visibleName;
var folderName;
var immersive;
var appType;
var target;

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
      default: ['Lumin'],
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
  if (argv.appType) {
    appType = argv.appType;
  } else {
    appType = 'Components';
  }
  if (argv.folderName && idRegex.test(argv.packageName)) {
    packageName = argv.packageName;
  }
  target = argv.target.map(util.toUpperCase);
  if (!isComponentsAndAtLeastOneTarget(appType, target)) {
    console.log(yellow, 'There is no proper target passed, project will generate Lumin files structure for Components app', normal);
    target = ['LUMIN'];
  }
  const currentDirectory = process.cwd();
  if (packageName && folderName && (appType === 'Immersive' || appType === 'Landscape')) {
    immersive = argv.appType === 'Immersive' || argv.immersive;
    copyFiles(templatePath, `${currentDirectory}/${folderName}`);
    return;
  }
  if (packageName && folderName && appType === 'Components') {
    templatePath = path.join(__dirname, '../template_components');
    copyComponentsFiles(templatePath, `${currentDirectory}/${folderName}`);
    copyManifest(`${currentDirectory}/${folderName}`);
    preparePlatforms(`${currentDirectory}/${folderName}`);
    console.log(green, `Project created successfully for platforms: ${target}`, normal);
    return;
  }

  let answerPromise = askQuestions();
  answerPromise.then(answers => {
    packageName = answers['APPID'];
    folderName = answers['FOLDERNAME'];
    visibleName = answers['APPNAME'];
    appType = answers['APPTYPE'];
    target = answers['COMPONENTS_PLATFORM'].map(util.toUpperCase);
    if (!target || target.length < 1) {
      console.log(yellow, 'There is no proper target passed, project will generate Lumin files structure for Components app', normal);
      target = ['LUMIN'];
    }
    immersive = appType === 'Immersive' || argv.immersive;
    if (appType === 'Components') {
      immersive = false;
      templatePath = path.join(__dirname, '../template_components');
      copyComponentsFiles(templatePath, `${currentDirectory}/${folderName}`);
      copyManifest(`${currentDirectory}/${folderName}`);
      preparePlatforms(`${currentDirectory}/${folderName}`);
      console.log(green, `Project successfully created for platforms: ${target}`, normal);
    } else {
      copyFiles(templatePath, `${currentDirectory}/${folderName}`);
      console.log(green, `Project successfully created for ${appType}`, normal);
    }
  }).catch(error => console.log(red, error, normal));
};

function preparePlatforms (destPath) {
  let android = target.includes('ANDROID');
  let iOS = target.includes('IOS');
  let lumin = target.includes('LUMIN');
  let isReact = (target.includes('IOS') && target.includes('ANDROID'));
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
  if ((isReact && lumin) || (android && lumin) || (iOS && lumin)) {
    fs.renameSync(`${destPath}/package.allplatforms.json`, `${destPath}/package.json`);
  } else if (isReact || android || iOS) {
    fs.renameSync(`${destPath}/package.reactnative.json`, `${destPath}/package.json`);
    removeLuminFiles(destPath);
  } else {
    fs.renameSync(`${destPath}/package.lumin.json`, `${destPath}/package.json`);
    removeReactFiles(destPath);
  }
  removePackageJsons(destPath);
}

function removePackageJsons (destPath) {
  if (fs.existsSync(`${destPath}/package.lumin.json`)) {
    fs.unlinkSync(`${destPath}/package.lumin.json`);
  }
  if (fs.existsSync(`${destPath}/package.reactnative.json`)) {
    fs.unlinkSync(`${destPath}/package.reactnative.json`);
  }
  if (fs.existsSync(`${destPath}/package.allplatforms.json`)) {
    fs.unlinkSync(`${destPath}/package.allplatforms.json`);
  }
}

function removeLuminFiles (destPath) {
  luminFiles.forEach(fileName => {
    if (fs.existsSync(`${destPath}/${fileName}`)) {
      fs.unlinkSync(`${destPath}/${fileName}`);
    }
  });
}

function removeReactFiles (destPath) {
  reactFiles.forEach(fileName => {
    if (fs.existsSync(`${destPath}/${fileName}`)) {
      fs.unlinkSync(`${destPath}/${fileName}`);
    }
  });
}

function isComponentsAndAtLeastOneTarget (appType, target) {
  return (appType === 'Components' && target && target.some(substring => {
    return targetPlatforms.includes(substring);
  }));
}
