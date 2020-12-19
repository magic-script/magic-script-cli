let {
  copyFiles,
  copyFileOrDir,
  deleteFiles,
  replaceContent
} = require('./renameutils');
let { bundleIdentifiers } = require('./config/bundleIdentifiers');
let path = require('path');
let fs = require('fs');
let logger = require('../logger');

module.exports.resolveFoldersAndFiles = function (params) {
  const {
    listOfFoldersAndFiles,
    noSpaceCurrentAppName,
    noSpaceNewName,
    dirname
  } = params;
  listOfFoldersAndFiles.forEach((element, index) => {
    const dest = element.replace(
      new RegExp(noSpaceCurrentAppName, 'i'),
      noSpaceNewName
    );
    copyFileOrDir(path.join(dirname, element), path.join(dirname, dest));
    deleteFiles(path.join(dirname, element));
  });
};

module.exports.resolveFilesToModifyContent = function (params) {
  const { listOfFilesToModifyContent, dirname, bundleID } = params;
  listOfFilesToModifyContent.map((file) => {
    file.paths.map((filePath, index) => {
      const newPaths = [];
      if (fs.existsSync(path.join(dirname, filePath))) {
        newPaths.push(path.join(dirname, filePath));
        replaceContent(file.regex, file.replacement, newPaths);
      }
    });
  });
  return bundleID;
};

module.exports.resolveJavaFiles = function (params) {
  let {
    currentAppName,
    newName,
    newPackageName,
    bundleID,
    lowcaseNoSpaceNewAppName,
    templateBundleId,
    dirname
  } = params;
  const newBundleID = bundleID;
  const javaFileBase = '/android/app/src/main/java';
  const newJavaPath = `${javaFileBase}/${newPackageName.replace(/\./g, '/')}`;
  const currentJavaPath = `${javaFileBase}/${templateBundleId.replace(
    /\./g,
    '/'
  )}`;

  const fullCurrentBundlePath = path.join(dirname, currentJavaPath);
  const fullNewBundlePath = path.join(dirname, newJavaPath);

  // Create new bundle folder if doesn't exist yet
  if (!fs.existsSync(fullNewBundlePath)) {
    fs.mkdirSync(fullNewBundlePath, { recursive: true });
    copyFiles(fullCurrentBundlePath, fullNewBundlePath);
    deleteFiles(fullCurrentBundlePath);
  }

  return {
    currentAppName,
    newName,
    templateBundleId,
    dirname,
    newBundleID,
    newJavaPath
  };
};

module.exports.deletePreviousBundleDirectory = function (templateBundleId) {
  const dir = templateBundleId.replace(/\./g, '/');
  deleteFiles(dir);
  logger.green('Done removing previous bundle directory.');
};

module.exports.resolveBundleIdentifiers = function (params) {
  const {
    currentAppName,
    newName,
    templateBundleId,
    dirname,
    newBundleID,
    newJavaPath
  } = params;
  bundleIdentifiers(
    currentAppName,
    newName,
    templateBundleId,
    newBundleID,
    newJavaPath
  ).map((file) => {
    file.paths.map((filePath, index) => {
      const newPaths = [];
      if (fs.existsSync(path.join(dirname, filePath))) {
        newPaths.push(path.join(dirname, filePath));
        replaceContent(file.regex, file.replacement, newPaths);
      }
    });
  });
};
