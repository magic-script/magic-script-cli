// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let process = require('process');
let fs = require('fs');
let templatePath = `${__dirname}/../template`;
let inquirer = require('inquirer');
const util = require('../lib/util');

var packageName;
var visibleName;
var projectName;
var immersive;

const askQuestions = () => {
  const questions = [
    {
      name: 'APPNAME',
      type: 'input',
      message: 'What is the name of your application?'
    },
    {
      name: 'APPID',
      type: 'input',
      message: 'What is the app ID of your application?',
      validate: util.isValidPackageId
    },
    {
      name: 'FOLDERNAME',
      type: 'input',
      message: 'In which folder do you want to save this project?',
      validate: util.isValidFolderName
    },
    {
      name: 'APPTYPE',
      type: 'confirm',
      message: 'Do you want a Landscape App?'
    },
    {
      type: 'checkbox',
      name: 'BUILDTARGETS',
      message: 'What are your device targets?',
      choices: ['Magic Leap', 'iOS', 'Android']
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
      } else if (immersive && file === 'main.js') {
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
  let answerPromise = askQuestions();
  answerPromise.then(answers => {
    packageName = answers['APPID'];
    projectName = answers['FOLDERNAME'];
    visibleName = answers['APPNAME'];
    immersive = !answers['APPTYPE'];
    const currentDirectory = process.cwd();
    copyFiles(templatePath, `${currentDirectory}/${projectName}`);
  });
};
