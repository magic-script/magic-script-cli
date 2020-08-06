// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let templatePath = `${__dirname}/../template`;
let inquirer = require('inquirer');
let path = require('path');
let logger = require('../lib/logger');
const util = require('../lib/util');
const initUtil = require('../lib/initutils');

var packageName;
var visibleName;
var folderName;
var immersive;
var appType;
var isComponents;
var typeScript;
var target = [];
var gitRepository;

const askQuestions = () => {
  const questions = [
    {
      name: 'APPNAME',
      type: 'input',
      message: 'What is the name of your application?',
      validate: util.validateAppName,
      default: visibleName
    },
    {
      name: 'APPID',
      type: 'input',
      message: 'What is the app ID of your application?',
      validate: util.validatePackageId,
      default: packageName
    },
    {
      name: 'FOLDERNAME',
      type: 'input',
      message: 'In which folder do you want to save this project?',
      validate: util.validateFolderName,
      default: folderName
    },
    {
      name: 'ISCOMPONENTS',
      type: 'confirm',
      message: 'Do you want to create Components app?',
      default: isComponents
    },
    {
      name: 'APPTYPE',
      type: 'list',
      message: 'What app type do you want?',
      choices: ['Landscape', 'Immersive'],
      default: appType
    },
    {
      name: 'TARGET',
      type: 'checkbox',
      message: 'What platform do you want to develop on?',
      choices: [
        {
          name: 'Lumin'
        },
        {
          name: 'iOS'
        },
        {
          name: 'Android'
        }
      ],
      default: ['Lumin'],
      when: initUtil.isComponentsAppType
    },
    {
      name: 'TYPESCRIPT',
      type: 'confirm',
      message: 'Use TypeScript?',
      default: false
    },
    {
      name: 'GIT',
      type: 'confirm',
      message: 'Initialize git repository for project?',
      default: false
    }
  ];
  return inquirer.prompt(questions);
};

module.exports = (argv) => {
  // eslint-disable-next-line no-useless-escape
  setVisibleName(argv.visibleName);
  setFolderName(argv.folderName);
  setAppType(argv.appType);
  setPackageName(argv.packageName);
  const currentDirectory = process.cwd();
  let destDirectory;
  immersive = argv.appType === 'Immersive' || argv.immersive;
  isComponents = argv.isComponents;
  if ((typeof isComponents !== 'undefined') && isComponents === false) {
    logger.green(`Start creating Vanilla Magic Script project for ${appType} app type`);
    destDirectory = path.join(currentDirectory, folderName);
    initUtil.copyVanillaFiles(templatePath, destDirectory, immersive, packageName, visibleName);
    if (argv.typeScript) {
      initUtil.prepareTypescript(currentDirectory, folderName);
      // Copy typescript template overlay over existing template files
      templatePath = path.join(__dirname, '../template_overlay_typescript');
      initUtil.copyVanillaFiles(templatePath, destDirectory, immersive, packageName, visibleName);
    }
    logger.green(`Vanilla Magic Script project successfully created for ${appType} app type`);
    resetValues();
    return;
  }
  if ((typeof isComponents !== 'undefined') && isComponents === true) {
    destDirectory = path.join(currentDirectory, folderName);
    setTarget(argv.target);
    logger.green(`Start creating project for Components type, target: ${target}`);
      templatePath = path.join(__dirname, '../template_multiplatform_components');
      initUtil.copyComponentFiles(templatePath, destDirectory, immersive, packageName);
      if (argv.typeScript) {
        initUtil.prepareComponentsTypescript(currentDirectory, folderName);
        // Copy typescript template overlay over existing template files
        templatePath = path.join(__dirname, '../template_overlay_typescript_components');
        initUtil.copyComponentFiles(templatePath, destDirectory, immersive, packageName);
      }
      initUtil.renameComponentsFiles(folderName, packageName, visibleName, target);
      let symlinkSuccess = initUtil.createSymlink(currentDirectory, folderName);
      if (!symlinkSuccess) {
        logger.yellow('Couldn\'t create symlink for resources directory. Please do it manually if you want to use resources in your project. For more information check: https:///magicscript.org/');
      }
      initUtil.preparePlatforms(destDirectory, target);
      logger.green(`Project successfully created for platforms: ${target}`);
      resetValues();
      return;
  }
  let answerPromise = askQuestions();
  answerPromise
    .then(answers => {
      packageName = answers['APPID'];
      folderName = answers['FOLDERNAME'];
      visibleName = answers['APPNAME'];
      appType = answers['APPTYPE'];
      target = answers['TARGET'];
      typeScript = answers['TYPESCRIPT'];
      isComponents = answers['ISCOMPONENTS'];
      immersive = appType === 'Immersive';
      gitRepository = answers['GIT'];
      destDirectory = path.join(currentDirectory, folderName);
      if (isComponents) {
        setTarget(target);
        logger.green(`Start creating project for Components type, target: ${target}`);
        templatePath = path.join(__dirname, '../template_multiplatform_components');
        initUtil.copyComponentFiles(templatePath, destDirectory, immersive, packageName);
        if (typeScript) {
          initUtil.prepareComponentsTypescript(currentDirectory, folderName);
          // Copy typescript template overlay over existing template files
          templatePath = path.join(__dirname, '../template_overlay_typescript_components');
          initUtil.copyComponentFiles(templatePath, destDirectory, immersive, packageName);
        }
        initUtil.renameComponentsFiles(folderName, packageName, visibleName, target);
        if (!initUtil.createSymlink(currentDirectory, folderName)) {
          logger.yellow('Couldn\'t create symlink for resources directory. Please do it manually if you want to use resources in your project. For more information check: https:///magicscript.org/');
        }
        initUtil.preparePlatforms(destDirectory, target);
        logger.green(`Project successfully created for platforms: ${target}`);
      } else {
        logger.green(`Start creating Vanilla Magic Script project for ${appType} app type`);
        initUtil.copyVanillaFiles(templatePath, destDirectory, immersive, packageName, visibleName);
        if (typeScript) {
          initUtil.prepareTypescript(currentDirectory, folderName);
          // Copy typescript template overlay over existing template files
          templatePath = path.join(__dirname, '../template_overlay_typescript');
          initUtil.copyVanillaFiles(templatePath, destDirectory, immersive, packageName, visibleName);
        }
        logger.green(`Vanilla Magic Script project successfully created for ${appType} app type`);
      }
      if (gitRepository) {
        initUtil.createGitRepository(folderName);
      }
    })
    .catch(err => logger.red(err))
    // Add this callback for testing purpose - inquirer doesn't provide functionality to reset values
    // after every test and caches them
    .finally(() => {
      resetValues();
    });
};

function setFolderName(name) {
  if (name && util.isValidFolderName(name)) {
    folderName = name;
    if (!visibleName) {
      visibleName = folderName;
    }
  }
}

function setVisibleName(name) {
  if (name) {
    visibleName = name;
  }
}

function setAppType(type) {
  if (util.isValidAppType(type)) {
    appType = type;
  }
}

function setPackageName(name) {
  if (name && util.isValidPackageId(name)) {
    packageName = name;
  }
}

function setTarget(argTarget) {
  if (argTarget && Array.isArray(argTarget)) {
    target = argTarget.map(string => {
      return string.toUpperCase();
    });
  } else {
    logger.yellow('There is no proper target passed, project will generate Lumin files structure for Components app');
    target = ['LUMIN'];
  }
}

function resetValues() {
  folderName = null;
  visibleName = null;
  appType = null;
  packageName = null;
  target = null;
  typeScript = null;
}
