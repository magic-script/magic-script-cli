let {
  copyFiles,
  copyFileOrDir,
  readFile,
  deleteFiles,
  replaceContent
} = require('./renameutils');
let { bundleIdentifiers } = require('./config/bundleIdentifiers');
let { filesToModifyContent } = require('./config/filesToModifyContent');
let { foldersAndFiles } = require('./config/foldersAndFiles');
let fs = require('fs');
let path = require('path');
let logger = require('../logger');
const templateAppName = 'Template';
const templateBundleId = 'com.magicscript.template';

// We are not validating name or package name at this point - it is validated when passing data via CLI in the first place.
module.exports.rename = async function (dirname, newName, newPackageName) {
  readFile(
    path.join(dirname, 'android/app/src/main/res/values/strings.xml')
  ).then((data) => {
    let newBundlePath;
    const currentAppName = templateAppName;
    const noSpaceCurrentAppName = templateAppName;
    const lowcaseNoSpaceCurrentAppName = noSpaceCurrentAppName.toLowerCase();
    const noSpaceNewName = newName.replace(/\s/g, '');
    const lowcaseNoSpaceNewAppName = noSpaceNewName.toLowerCase();
    const bundleID = newPackageName ? newPackageName.toLowerCase() : null;
    const listOfFoldersAndFiles = foldersAndFiles(currentAppName, newName);
    const listOfFilesToModifyContent = filesToModifyContent(
      currentAppName,
      newName
    );

    if (
      newName === currentAppName ||
      newName === noSpaceCurrentAppName ||
      newName === lowcaseNoSpaceCurrentAppName
    ) {
      return logger.red('Please try a different name.');
    }

    // Move files and folders from ./config/foldersAndFiles.js
    const resolveFoldersAndFiles = new Promise((resolve) => {
      listOfFoldersAndFiles.forEach((element, index) => {
        const dest = element.replace(
          new RegExp(noSpaceCurrentAppName, 'i'),
          noSpaceNewName
        );
        if (
          fs.existsSync(path.join(dirname, element)) ||
          !fs.existsSync(path.join(dirname, element))
        ) {
          copyFileOrDir(path.join(dirname, element), path.join(dirname, dest));
          deleteFiles(path.join(dirname, element));
        }
      });
      resolve();
    });

    // Modify file content from ./config/filesToModifyContent.js
    const resolveFilesToModifyContent = () =>
      new Promise((resolve) => {
        listOfFilesToModifyContent.map((file) => {
          file.paths.map((filePath, index) => {
            const newPaths = [];
            if (fs.existsSync(path.join(dirname, filePath))) {
              newPaths.push(path.join(dirname, filePath));
              replaceContent(file.regex, file.replacement, newPaths);
            }
          });
        });
        resolve(bundleID);
      });

    const resolveJavaFiles = (newPackageName) =>
      new Promise((resolve) => {
        const newBundleID = newPackageName
          ? bundleID
          : `com.${lowcaseNoSpaceNewAppName}`;
        const javaFileBase = '/android/app/src/main/java';
        const newJavaPath = `${javaFileBase}/${newBundleID.replace(
          /\./g,
          '/'
        )}`;
        const currentJavaPath = `${javaFileBase}/${templateBundleId.replace(
          /\./g,
          '/'
        )}`;

        if (bundleID) {
          newBundlePath = newJavaPath;
        } else {
          newBundlePath = newBundleID.replace(/\./g, '/').toLowerCase();
          newBundlePath = `${javaFileBase}/${newBundlePath}`;
        }

        const fullCurrentBundlePath = path.join(dirname, currentJavaPath);
        const fullNewBundlePath = path.join(dirname, newBundlePath);

        // Create new bundle folder if doesn't exist yet
        if (!fs.existsSync(fullNewBundlePath)) {
          fs.mkdirSync(fullNewBundlePath, { recursive: true });
          copyFiles(fullCurrentBundlePath, fullNewBundlePath);
          deleteFiles(fullCurrentBundlePath);
        }

        const vars = {
          templateBundleId,
          newBundleID,
          newBundlePath,
          javaFileBase,
          currentJavaPath,
          newJavaPath
        };
        resolve(vars);
      });

    const deletePreviousBundleDirectory = () => {
      const dir = templateBundleId.replace(/\./g, '/');
      deleteFiles(dir);
      Promise.resolve();
    };

    const resolveBundleIdentifiers = (params) =>
      new Promise((resolve) => {
        const {
          newBundleID,
          newBundlePath,
          javaFileBase,
          currentJavaPath,
          newJavaPath
        } = params;
        bundleIdentifiers(
          currentAppName,
          newName,
          templateBundleId,
          newBundleID,
          newBundlePath
        ).map((file) => {
          file.paths.map((filePath, index) => {
            const newPaths = [];
            if (fs.existsSync(path.join(dirname, filePath))) {
              newPaths.push(path.join(dirname, filePath));
              replaceContent(file.regex, file.replacement, newPaths);
            }
          });
        });
        const oldBundleNameDir = path.join(
          dirname,
          javaFileBase,
          templateBundleId
        );
        resolve({
          oldBundleNameDir,
          shouldDelete: currentJavaPath !== newJavaPath
        });
      });

    const rename = () => {
      resolveFoldersAndFiles
        .then(resolveFilesToModifyContent)
        .then(resolveJavaFiles)
        .then(resolveBundleIdentifiers)
        .then(deletePreviousBundleDirectory)
        .then(() =>
          logger.green(`APP SUCCESSFULLY RENAMED TO "${newName}"! 🎉 🎉 🎉`)
        )
        .then(() => {
          if (fs.existsSync(path.join(dirname, 'ios', 'Podfile'))) {
            logger.yellow(
              'Podfile has been modified, please run "pod install" inside ios directory.'
            );
          }
        })
        .then(() => {
          logger.yellow(
            'Please make sure to run "watchman watch-del-all" and "npm start --reset-cache" before running the app.'
          );
        });
    };
    rename();
  });
};
