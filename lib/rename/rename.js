let {
  resolveFoldersAndFiles,
  resolveFilesToModifyContent,
  resolveJavaFiles,
  deletePreviousBundleDirectory,
  resolveBundleIdentifiers
} = require('./renamesteps');
// let { bundleIdentifiers } = require('./config/bundleIdentifiers');
let { filesToModifyContent } = require('./config/filesToModifyContent');
let { foldersAndFiles } = require('./config/foldersAndFiles');
let fs = require('fs');
let path = require('path');
let logger = require('../logger');
const templateAppName = 'Template';
const templateBundleId = 'com.magicscript.template';

// We are not validating name or package name at this point - it is validated when passing data via CLI in the first place.
module.exports.rename = function (dirname, newName, newPackageName) {
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
  resolveFoldersAndFiles({
    listOfFoldersAndFiles,
    noSpaceCurrentAppName,
    noSpaceNewName,
    dirname
  });
  const newBundleId = resolveFilesToModifyContent({
    listOfFilesToModifyContent,
    dirname,
    bundleID
  });
  const parameters = resolveJavaFiles({
    currentAppName,
    newName,
    newBundleId,
    bundleID,
    lowcaseNoSpaceNewAppName,
    templateBundleId,
    newBundlePath,
    dirname
  });
  resolveBundleIdentifiers(parameters);
  deletePreviousBundleDirectory(templateBundleId);
  logger.green(`APP SUCCESSFULLY RENAMED TO "${newName}"! 🎉 🎉 🎉`);
  if (fs.existsSync(path.join(dirname, 'ios', 'Podfile'))) {
    logger.yellow(
      'Podfile has been modified, please run "pod install" inside ios directory.'
    );
  }
  logger.yellow(
    'Please make sure to run "watchman watch-del-all" and "npm start --reset-cache" before running the app.'
  );

  // Move files and folders from ./config/foldersAndFiles.js
  // function resolveFoldersAndFiles() {
  //   listOfFoldersAndFiles.forEach((element, index) => {
  //     const dest = element.replace(
  //       new RegExp(noSpaceCurrentAppName, 'i'),
  //       noSpaceNewName
  //     );
  //     if (
  //       fs.existsSync(path.join(dirname, element)) ||
  //       !fs.existsSync(path.join(dirname, element))
  //     ) {
  //       copyFileOrDir(path.join(dirname, element), path.join(dirname, dest));
  //       deleteFiles(path.join(dirname, element));
  //     }
  //   });
  // }

  // Modify file content from ./config/filesToModifyContent.js
  // function resolveFilesToModifyContent() {
  //   listOfFilesToModifyContent.map((file) => {
  //     file.paths.map((filePath, index) => {
  //       const newPaths = [];
  //       if (fs.existsSync(path.join(dirname, filePath))) {
  //         newPaths.push(path.join(dirname, filePath));
  //         replaceContent(file.regex, file.replacement, newPaths);
  //       }
  //     });
  //   });
  //   return bundleID;
  // }

  // function resolveJavaFiles(newPackageName) {
  //   const newBundleID = newPackageName
  //     ? bundleID
  //     : `com.${lowcaseNoSpaceNewAppName}`;
  //   const javaFileBase = '/android/app/src/main/java';
  //   const newJavaPath = `${javaFileBase}/${newBundleID.replace(/\./g, '/')}`;
  //   const currentJavaPath = `${javaFileBase}/${templateBundleId.replace(
  //     /\./g,
  //     '/'
  //   )}`;

  //   if (bundleID) {
  //     newBundlePath = newJavaPath;
  //   } else {
  //     newBundlePath = newBundleID.replace(/\./g, '/').toLowerCase();
  //     newBundlePath = `${javaFileBase}/${newBundlePath}`;
  //   }

  //   const fullCurrentBundlePath = path.join(dirname, currentJavaPath);
  //   const fullNewBundlePath = path.join(dirname, newBundlePath);

  //   // Create new bundle folder if doesn't exist yet
  //   if (!fs.existsSync(fullNewBundlePath)) {
  //     fs.mkdirSync(fullNewBundlePath, { recursive: true });
  //     copyFiles(fullCurrentBundlePath, fullNewBundlePath);
  //     deleteFiles(fullCurrentBundlePath);
  //   }

  //   return {
  //     templateBundleId,
  //     newBundleID,
  //     newBundlePath,
  //     javaFileBase,
  //     currentJavaPath,
  //     newJavaPath
  //   };
  // }

  // function deletePreviousBundleDirectory() {
  //   const dir = templateBundleId.replace(/\./g, '/');
  //   deleteFiles(dir);
  // }

  // function resolveBundleIdentifiers(params) {
  //   const {
  //     newBundleID,
  //     newBundlePath,
  //     javaFileBase,
  //     currentJavaPath,
  //     newJavaPath
  //   } = params;
  //   bundleIdentifiers(
  //     currentAppName,
  //     newName,
  //     templateBundleId,
  //     newBundleID,
  //     newBundlePath
  //   ).map((file) => {
  //     file.paths.map((filePath, index) => {
  //       const newPaths = [];
  //       if (fs.existsSync(path.join(dirname, filePath))) {
  //         newPaths.push(path.join(dirname, filePath));
  //         replaceContent(file.regex, file.replacement, newPaths);
  //       }
  //     });
  //   });
  //   const oldBundleNameDir = path.join(dirname, javaFileBase, templateBundleId);
  //   return {
  //     oldBundleNameDir,
  //     shouldDelete: currentJavaPath !== newJavaPath
  //   };
  // }
};
