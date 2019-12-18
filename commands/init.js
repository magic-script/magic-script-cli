// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let process = require('process');
let fs = require('fs');
let templatePath = `${__dirname}/../template`;
let inquirer = require('inquirer');
let path = require('path');
const util = require('../lib/util');
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
var target = [];

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
      default: appType
    },
    {
      name: 'TARGET',
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
  util.copyComponentsFiles(srcPath, destPath);
}

function copyManifest (destPath) {
  let manifestPath = `${destPath}/lumin/manifest.xml`;
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
  setVisibleName(argv.visibleName);
  setFolderName(argv.folderName);
  setAppType(argv.appType);
  setPackageName(argv.packageName);
  const currentDirectory = process.cwd();
  if (isLandscapeOrImmersive(folderName, packageName, appType)) {
    immersive = argv.appType === 'Immersive' || argv.immersive;
    copyFiles(templatePath, `${currentDirectory}/${folderName}`);
    console.log(green, `${appType} project created successfully!`, normal);
    resetValues();
    return;
  }
  if (isComponents(folderName, packageName, appType)) {
    setTarget(appType, argv.target);
    templatePath = path.join(__dirname, '../template_components');
    copyComponentsFiles(templatePath, `${currentDirectory}/${folderName}`);
    fs.symlinkSync(`${currentDirectory}/${folderName}/resources`, `${currentDirectory}/${folderName}/reactnative`);
    copyManifest(`${currentDirectory}/${folderName}`);
    util.renameComponentsFiles(folderName, packageName);
    preparePlatforms(`${currentDirectory}/${folderName}`);
    if (fs.existsSync(`${currentDirectory}/${folderName}/reactnative`)) {
      fs.symlinkSync(`${currentDirectory}/${folderName}/resources`, `${currentDirectory}/${folderName}/reactnative`);
    }
    console.log(green, `Components project created successfully for platforms: ${target}!`, normal);
    resetValues();
    return;
  }
  let answerPromise = askQuestions();
  answerPromise.then(answers => {
    packageName = answers['APPID'];
    folderName = answers['FOLDERNAME'];
    visibleName = answers['APPNAME'];
    appType = answers['APPTYPE'];
    target = answers['TARGET'];
    immersive = appType === 'Immersive';
    if (isComponents(folderName, packageName, appType)) {
      setTarget(appType, target);
      console.log(green, `Start creating project for Components type, target: ${target}`, normal);
      templatePath = path.join(__dirname, '../template_components');
      copyComponentsFiles(templatePath, `${currentDirectory}/${folderName}`);
      copyManifest(`${currentDirectory}/${folderName}`);
      util.renameComponentsFiles(folderName, packageName);
      preparePlatforms(`${currentDirectory}/${folderName}`);
      if (fs.existsSync(`${currentDirectory}/${folderName}/reactnative`)) {
        fs.symlinkSync(`${currentDirectory}/${folderName}/resources`, `${currentDirectory}/${folderName}/reactnative`);
      }
      console.log(green, `Project successfully created for platforms: ${target}`, normal);
    } else if (isLandscapeOrImmersive(folderName, packageName, appType)) {
      console.log(green, `Start creating project for ${appType} type`, normal);
      copyFiles(templatePath, `${currentDirectory}/${folderName}`);
      console.log(green, `Project successfully created for ${appType}`, normal);
    }
  }).catch((err) => console.log(red, err, normal))
    // Add this callback for testing purpose - inquirer doesn't provide functionality to reset values
    // after every test and caches them
    .finally(() => {
      folderName = null;
      visibleName = null;
      appType = null;
      packageName = null;
      target = null;
    });
};

function preparePlatforms (destPath) {
  let android = target.includes('ANDROID');
  let iOS = target.includes('IOS');
  let lumin = target.includes('LUMIN');
  let isReact = (target.includes('IOS') || target.includes('ANDROID'));
  if (!iOS) {
    if (fs.existsSync(`${destPath}/reactnative/ios`)) {
      fs.rmdirSync(`${destPath}/reactnative/ios`, { recursive: true });
    }
  }
  if (!android) {
    if (fs.existsSync(`${destPath}/reactnative/android`)) {
      fs.rmdirSync(`${destPath}/reactnative/android`, { recursive: true });
    }
  } else {
    util.createAndroidLocalProperties(destPath);
  }
  if (!isReact) {
    if (fs.existsSync(`${destPath}/reactnative`)) {
      fs.rmdirSync(`${destPath}/reactnative`, { recursive: true });
    }
  }
  if (!lumin) {
    if (fs.existsSync(`${destPath}/lumin`)) {
      fs.rmdirSync(`${destPath}/lumin`, { recursive: true });
    }
  }
}

function isComponentsAndAtLeastOneTarget (appType, argTarget) {
  return (appType === 'Components' && argTarget && argTarget.some(substring => {
    return targetPlatforms.includes(substring);
  }));
}

function setFolderName (name) {
  if (util.isValidFolderName(name)) {
    folderName = name;
    if (!visibleName) {
      visibleName = folderName;
    }
  }
}

function setVisibleName (name) {
  if (name) {
    visibleName = name;
  }
}

function setAppType (type) {
  if (util.isValidAppType(type)) {
    appType = type;
  }
}

function setPackageName (name) {
  if (util.isValidPackageId(name)) {
    packageName = name;
  }
}

function isLandscapeOrImmersive (folderName, packageName, appType) {
  return packageName && folderName && appType && (appType === 'Immersive' || appType === 'Landscape');
}

function isComponents (folderName, packageName, appType) {
  return folderName && packageName && appType && appType === 'Components';
}

function setTarget (appType, argTarget) {
  if (argTarget && Array.isArray(argTarget)) {
    target = argTarget.map(toUpperCase);
  }
  if (!isComponentsAndAtLeastOneTarget(appType, target)) {
    console.log(yellow, 'There is no proper target passed, project will generate Lumin files structure for Components app', normal);
    target = ['LUMIN'];
  }
}

function toUpperCase (string) {
  return string.toUpperCase();
}

function resetValues () {
  folderName = null;
  visibleName = null;
  appType = null;
  packageName = null;
  target = null;
}
