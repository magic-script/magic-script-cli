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
let path = require('path');
let fs = require('fs');
let logger = require('../logger');

export const resolveFoldersAndFiles = (
  noSpaceCurrentAppName,
  noSpaceNewName,
  dirname,
  listOfFoldersAndFiles
) =>
  new Promise((resolve) => {
    listOfFoldersAndFiles.forEach((element, index) => {
      const dest = element.replace(
        new RegExp(noSpaceCurrentAppName, 'i'),
        noSpaceNewName
      );
      let itemsProcessed = 1;
      const successMsg = `/${dest} RENAMED`;

      setTimeout(() => {
        itemsProcessed += index;

        if (
          fs.existsSync(path.join(dirname, element)) ||
          !fs.existsSync(path.join(dirname, element))
        ) {
          copyFileOrDir(path.join(dirname, element), path.join(dirname, dest));
          deleteFiles(path.join(dirname, element));
          console.log(successMsg);
        }

        if (itemsProcessed === listOfFoldersAndFiles.length) {
          resolve();
        }
      }, 200 * index);
    });
  });

export const resolveFilesToModifyContent = (
  bundleID,
  listOfFilesToModifyContent,
  dirname
) =>
  new Promise((resolve) => {
    let filePathsCount = 0;
    let itemsProcessed = 0;
    listOfFilesToModifyContent.map((file) => {
      filePathsCount += file.paths.length;

      file.paths.map((filePath, index) => {
        const newPaths = [];

        setTimeout(() => {
          itemsProcessed++;
          if (fs.existsSync(path.join(dirname, filePath))) {
            newPaths.push(path.join(dirname, filePath));
            replaceContent(file.regex, file.replacement, newPaths);
          }
          if (itemsProcessed === filePathsCount) {
            resolve(
              currentAppName,
              newName,
              newBundlePath,
              bundleID,
              templateBundleId,
              dirname,
              lowcaseNoSpaceNewAppName,
              newPackageName
            );
          }
        }, 200 * index);
      });
    });
  });

export const resolveJavaFiles = (
  currentAppName,
  newName,
  newBundlePath,
  bundleID,
  templateBundleId,
  dirname,
  lowcaseNoSpaceNewAppName,
  newPackageName
) =>
  new Promise((resolve) => {
    readFile(
      path.join(dirname, 'android/app/src/main/AndroidManifest.xml')
    ).then((data) => {
      const newBundleID = newPackageName
        ? bundleID
        : `com.${lowcaseNoSpaceNewAppName}`;
      const javaFileBase = '/android/app/src/main/java';
      const newJavaPath = `${javaFileBase}/${newBundleID.replace(/\./g, '/')}`;
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
        logger.green(`${newBundlePath} bundle identifier changed!`);
      }

      const vars = {
        currentAppName,
        newName,
        templateBundleId,
        dirname,
        newBundleID,
        newBundlePath,
        javaFileBase,
        currentJavaPath,
        newJavaPath
      };
      resolve(vars);
    });
  });

export const deletePreviousBundleDirectory = (templateBundleId) => {
  const dir = templateBundleId.replace(/\./g, '/');
  deleteFiles(dir);
  Promise.resolve();
  logger.green('Done removing previous bundle directory.');
};

export const resolveBundleIdentifiers = (params) =>
  new Promise((resolve) => {
    let filePathsCount = 0;
    const {
      currentAppName,
      newName,
      templateBundleId,
      dirname,
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
      filePathsCount += file.paths.length - 1;
      let itemsProcessed = 0;

      file.paths.map((filePath, index) => {
        const newPaths = [];
        if (fs.existsSync(path.join(dirname, filePath))) {
          newPaths.push(path.join(dirname, filePath));

          setTimeout(() => {
            itemsProcessed += index;
            replaceContent(file.regex, file.replacement, newPaths);
            if (itemsProcessed === filePathsCount) {
              const oldBundleNameDir = path.join(
                dirname,
                javaFileBase,
                templateBundleId
              );
              resolve({
                oldBundleNameDir,
                shouldDelete: currentJavaPath !== newJavaPath
              });
            }
          }, 200 * index);
        }
      });
    });
  });
