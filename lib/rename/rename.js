let {
  resolveFoldersAndFiles,
  resolveFilesToModifyContent,
  resolveJavaFiles,
  deletePreviousBundleDirectory,
  resolveBundleIdentifiers
} = require('./renamesteps');
let { filesToModifyContent } = require('./config/filesToModifyContent');
let { foldersAndFiles } = require('./config/foldersAndFiles');
let fs = require('fs');
let path = require('path');
let logger = require('../logger');
const templateAppName = 'Template';
const templateBundleId = 'com.magicscript.template';

// We are not validating name or package name at this point - it is validated when passing data via CLI in the first place.
module.exports.rename = function (dirname, newName, newPackageName) {
  const currentAppName = templateAppName;
  const noSpaceCurrentAppName = templateAppName;
  const lowcaseNoSpaceCurrentAppName = templateAppName.toLowerCase();
  const noSpaceNewName = newName.replace(/\s/g, '');
  const lowcaseNoSpaceNewAppName = noSpaceNewName.toLowerCase();
  const bundleID = newPackageName.toLowerCase();
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
  resolveFilesToModifyContent({
    listOfFilesToModifyContent,
    dirname,
    bundleID
  });
  const parameters = resolveJavaFiles({
    currentAppName,
    newName,
    newPackageName,
    bundleID,
    lowcaseNoSpaceNewAppName,
    templateBundleId,
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
};
