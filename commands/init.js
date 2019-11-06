// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let process = require('process');
let fs = require('fs');
let templatePath = `${__dirname}/../template`;
let inquirer = require('inquirer');
const util = require('../lib/util');

var packageName;
var visibleName;
var folderName;
var immersive;

const validatePackageId = (packageId) => util.isValidPackageId(packageId) ? true
  : 'Invalid package ID. Must match ' + util.PackageIdRegex.toString();

const validateFolderName = (folderName) => util.isValidFolderName(folderName) ? true
  : 'Invalid folder name. Must match ' + util.FolderNameRegex.toString();

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
      validate: validatePackageId,
      default: packageName
    },
    {
      name: 'FOLDERNAME',
      type: 'input',
      message: 'In which folder do you want to save this project?',
      validate: validateFolderName,
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
      name: 'TYPESCRIPT',
      type: 'confirm',
      message: 'Use TypeScript?',
      default: false
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
  if (argv.visibleName) {
    visibleName = argv.visibleName;
  }
  if (argv.folderName && util.isValidFolderName(argv.folderName)) {
    folderName = argv.folderName;
    if (!visibleName) {
      visibleName = folderName;
    }
  }
  if (argv.packageName && util.isValidPackageId(argv.packageName)) {
    packageName = argv.packageName;
  }
  const currentDirectory = process.cwd();
  if (packageName && folderName) {
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
    let typescript = answers['TYPESCRIPT'];

    immersive = appType === 'Immersive' || argv.immersive;
    if (appType === 'Components') {
      immersive = false;
      templatePath = `${__dirname}/../template_components`;
    }
    copyFiles(templatePath, `${currentDirectory}/${folderName}`);

    if (typescript) {
      // Remove non-typescript source files from template
      fs.unlinkSync(`${currentDirectory}/${folderName}/src/main.js`);
      fs.unlinkSync(`${currentDirectory}/${folderName}/src/app.js`);
      // Copy typescript template overlay over existing template files
      const pathSuffix = (appType === 'Components') ? '_components' : '';
      templatePath = `${__dirname}/../template_overlay_typescript${pathSuffix}`;
      copyFiles(templatePath, `${currentDirectory}/${folderName}`);
    }
  });
};
