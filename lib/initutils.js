// Copyright (c) 2020 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let fs = require('fs');
const logger = require('../lib/logger');
const util = require('../lib/util');
// const rename = require.resolve('react-native-rename');
const rename = require('../lib/rename/rename');
let { spawnSync, execSync } = require('child_process');

module.exports.updateManifest = function (
  contents,
  packageName,
  visibleName,
  immersive
) {
  logger.yellow('Updating manifest file');
  let replaced = contents
    .replace('com.magicleap.magicscript.hello-sample', packageName)
    .replace(new RegExp('MagicScript Hello Sample', 'g'), visibleName);
  if (immersive) {
    replaced = replaced
      .replace('universe', 'fullscreen')
      .replace('Universe', 'Fullscreen')
      .replace(
        '<uses-privilege ml:name="MagicScript"/>',
        '<uses-privilege ml:name="LowLatencyLightwear"/>\n    <uses-privilege ml:name="MagicScript"/>'
      );
  }
  return replaced;
};

module.exports.updateComponentManifest = function (contents) {
  let replaced = contents
    .replace('universe', 'fullscreen')
    .replace('Universe', 'Fullscreen')
    .replace(
      '<uses-privilege ml:name="MagicScript"/>',
      '<uses-privilege ml:name="LowLatencyLightwear"/>\n    <uses-privilege ml:name="MagicScript"/>'
    );
  return replaced;
};

module.exports.copyComponentFiles = function (
  srcPath,
  destPath,
  immersive,
  packageName
) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }
  const filesToCreate = fs.readdirSync(srcPath);
  filesToCreate.forEach((file) => {
    const origFilePath = `${srcPath}/${file}`;
    const stats = fs.statSync(origFilePath);
    if (stats.isFile()) {
      if (immersive && file === 'manifest.xml') {
        var contents = fs.readFileSync(origFilePath, 'utf8');
        contents = this.updateComponentManifest(contents);
        const writePath = `${destPath}/${file}`;
        fs.writeFileSync(writePath, contents, 'utf8');
      } else if (immersive && (file === 'main.js' || file === 'main.tsx')) {
        var contents = fs.readFileSync(origFilePath, 'utf8');
        contents = contents.replace('landscape', 'immersive');
        const writePath = `${destPath}/${file}`;
        fs.writeFileSync(writePath, contents, 'utf8');
      } else if (
        file === 'model.fbx' ||
        file === 'model.kmat' ||
        file === 'portal.fbx' ||
        file === 'portal.kmat'
      ) {
        var contents = fs.readFileSync(origFilePath, 'utf8');
        contents = contents.replace(
          new RegExp('com_magicscript_template', 'g'),
          packageName.replace(/\./g, '_')
        );
        const writePath = `${destPath}/${file}`;
        fs.writeFileSync(writePath, contents, 'utf8');
      } else {
        var contents = fs.readFileSync(origFilePath);
        const writePath = `${destPath}/${file}`;
        fs.writeFileSync(writePath, contents);
      }
    } else if (stats.isDirectory()) {
      let newDestPath = `${destPath}/${file}`;
      this.copyComponentFiles(
        origFilePath,
        newDestPath,
        immersive,
        packageName
      );
    }
  });
};

module.exports.copyVanillaFiles = function (
  srcPath,
  destPath,
  immersive,
  packageName,
  visibleName
) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }
  const filesToCreate = fs.readdirSync(srcPath);
  filesToCreate.forEach((file) => {
    const origFilePath = `${srcPath}/${file}`;
    const stats = fs.statSync(origFilePath);
    if (stats.isFile()) {
      var contents = fs.readFileSync(origFilePath, 'utf8');
      if (file === 'manifest.xml') {
        contents = this.updateManifest(
          contents,
          packageName,
          visibleName,
          immersive
        );
        fs.writeFileSync(`${destPath}/${file}`, contents, 'utf8');
      } else if (immersive && (file === 'app.js' || file === 'app.ts')) {
        contents = contents.replace(
          new RegExp('LandscapeApp', 'g'),
          'ImmersiveApp'
        );
        fs.writeFileSync(`${destPath}/${file}`, contents, 'utf8');
      } else if (
        file === 'model.fbx' ||
        file === 'model.kmat' ||
        file === 'portal.fbx' ||
        file === 'portal.kmat'
      ) {
        contents = contents.replace(
          new RegExp('com_magicleap_magicscript_hello-sample', 'g'),
          packageName.replace(/\./g, '_')
        );
        fs.writeFileSync(`${destPath}/${file}`, contents, 'utf8');
      } else {
        fs.writeFileSync(`${destPath}/${file}`, fs.readFileSync(origFilePath));
      }
    } else if (stats.isDirectory()) {
      let newDestPath = `${destPath}/${file}`;
      this.copyVanillaFiles(
        origFilePath,
        newDestPath,
        immersive,
        packageName,
        visibleName
      );
    }
  });
};

module.exports.preparePlatforms = function (destPath, target) {
  let android = target.includes('ANDROID');
  let iOS = target.includes('IOS');
  let lumin = target.includes('LUMIN');
  let isReact = target.includes('IOS') || target.includes('ANDROID');
  if (!iOS) {
    if (fs.existsSync(`${destPath}/reactnative/ios`)) {
      util.removeFilesRecursively(`${destPath}/reactnative/ios`);
    }
  }
  if (!android) {
    if (fs.existsSync(`${destPath}/reactnative/android`)) {
      util.removeFilesRecursively(`${destPath}/reactnative/android`);
    }
  } else {
    this.createAndroidLocalProperties(destPath);
  }
  if (!isReact) {
    if (fs.existsSync(`${destPath}/reactnative`)) {
      util.removeFilesRecursively(`${destPath}/reactnative`);
    }
  }
  if (!lumin) {
    if (fs.existsSync(`${destPath}/lumin`)) {
      util.removeFilesRecursively(`${destPath}/lumin`);
    }
  }
};

module.exports.isComponentsAppType = function (answers) {
  return answers.ISCOMPONENTS === true;
};

module.exports.createSymlink = function (currentDirectory, folderName) {
  try {
    fs.symlinkSync(
      `../assets`,
      `${currentDirectory}/${folderName}/reactnative/assets`,
      'dir'
    );
    return true;
  } catch (error) {
    return false;
  }
};

module.exports.prepareComponentsTypescript = function (
  currentDirectory,
  folderName
) {
  fs.unlinkSync(`${currentDirectory}/${folderName}/lumin/src/main.js`);
  fs.unlinkSync(`${currentDirectory}/${folderName}/src/app.js`);
};

module.exports.prepareTypescript = function (currentDirectory, folderName) {
  fs.unlinkSync(`${currentDirectory}/${folderName}/src/main.js`);
  fs.unlinkSync(`${currentDirectory}/${folderName}/src/app.js`);
};

module.exports.renameComponentsFiles = function (
  folderName,
  packageName,
  visibleName,
  target
) {
  let projectPath = process.cwd();
  if (!visibleName) {
    logger.red('You have to specify the project name to rename the project!');
  } else {
    let manifestPath = `${projectPath}/${folderName}/lumin/manifest.xml`;
    if (fs.existsSync(manifestPath)) {
      let manifest = fs.readFileSync(manifestPath, 'utf8');
      if (manifest) {
        var result = '';
        if (visibleName && packageName) {
          logger.green(`new project name: ${visibleName}`);
          result = manifest.replace(
            /ml:visible_name="([^"]+)"/g,
            `ml:visible_name="${visibleName}"`
          );
          result = result.replace(
            /ml:package="([^"]+)"/g,
            `ml:package="${packageName}"`
          );
        } else if (visibleName) {
          logger.green(`new project name: ${visibleName}`);
          result = manifest.replace(
            /ml:visible_name="([^"]+)"/g,
            `ml:visible_name="${visibleName}"`
          );
        }
        if (result) {
          fs.writeFileSync(manifestPath, result, 'utf8');
          logger.green('Lumin manifest file has been updated successfully');
        }
      }
    }
    let isReact = target.includes('IOS') || target.includes('ANDROID');
    if (isReact) {
      var reactNativeProjectPath = `${process.cwd()}/${folderName}/reactnative`;
      if (fs.existsSync(reactNativeProjectPath)) {
        logger.green('Prepare project name and package in the project...');
        logger.yellow(`Path: ${reactNativeProjectPath}`);
        process.chdir(reactNativeProjectPath);
        rename.rename(reactNativeProjectPath, folderName, packageName);

        // spawnSync(renameCommand, [`${visibleName}`, '-b', `${packageName}`], {
        //   cwd: `${reactNativeProjectPath}`,
        //   shell: process.platform === 'win32',
        //   stdio: 'inherit'
        // });
      } else {
        logger.yellow(
          'Renaming of the project could not be processed because the path does not exist!'
        );
      }
    }
  }
};

module.exports.createAndroidLocalProperties = function (projPath) {
  if (!fs.existsSync(`${projPath}/reactnative/android/local.properties`)) {
    let androidHome = process.env.ANDROID_HOME;
    if (androidHome) {
      if (process.platform === 'win32') {
        androidHome = androidHome.replace(/\\/g, '\\\\');
      }
      let sdkDir = 'sdk.dir=' + androidHome;
      fs.writeFileSync(
        `${projPath}/reactnative/android/local.properties`,
        sdkDir,
        'utf-8'
      );
      logger.green('Successfully created local.properties file!');
    } else {
      logger.yellow(
        "Android SDK environment variable doesn't exist. Follow instructions to fix the problem: https://magicscript.org/"
      );
    }
  } else {
    logger.green('The local.properties file already exists!');
  }
};

module.exports.createGitRepository = function (repositoryPath) {
  try {
    execSync(
      `cd ${repositoryPath} && git init && git add . && git commit -am"Initial commit."`
    );
    logger.green('git repository initialised.');
  } catch (error) {
    logger.red('git repository not initialised - you have to do it manually.');
  }
};
