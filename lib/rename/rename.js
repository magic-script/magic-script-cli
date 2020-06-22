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
const currentBundleID = 'com.magicscript.template';

// We are not validating name or package name at this point - it is validated when passing data via CLI in the first place.
module.exports.rename = function (dirname, newName, newPackageName) {
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
        let itemsProcessed = 1;
        const successMsg = `/${dest} RENAMED`;

        setTimeout(() => {
          itemsProcessed += index;

          if (
            fs.existsSync(path.join(dirname, element)) ||
            !fs.existsSync(path.join(dirname, element))
          ) {
            copyFileOrDir(
              path.join(dirname, element),
              path.join(dirname, dest)
            );
            deleteFiles(path.join(dirname, element));
            console.log(successMsg);
          }

          if (itemsProcessed === listOfFoldersAndFiles.length) {
            resolve();
          }
        }, 200 * index);
      });
    });

    // Modify file content from ./config/filesToModifyContent.js
    const resolveFilesToModifyContent = () =>
      new Promise((resolve) => {
        let filePathsCount = 0;
        let itemsProcessed = 0;
        console.log(`Files to modify content: ${listOfFilesToModifyContent}`);
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
                resolve();
              }
            }, 200 * index);
          });
        });
      });

    const resolveJavaFiles = (newPackageName) =>
      new Promise((resolve) => {
        readFile(
          path.join(dirname, 'android/app/src/main/AndroidManifest.xml')
        ).then((data) => {
          const newBundleID = newPackageName
            ? bundleID
            : `com.${lowcaseNoSpaceNewAppName}`;
          const javaFileBase = '/android/app/src/main/java';
          const newJavaPath = `${javaFileBase}/${newBundleID.replace(
            /\./g,
            '/'
          )}`;
          const currentJavaPath = `${javaFileBase}/${currentBundleID.replace(
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
            currentBundleID,
            newBundleID,
            newBundlePath,
            javaFileBase,
            currentJavaPath,
            newJavaPath
          };
          resolve(vars);
        });
      });

    const deletePreviousBundleDirectory = ({
      oldBundleNameDir,
      shouldDelete
    }) => {
      if (shouldDelete) {
        const dir = oldBundleNameDir.replace(/\./g, '/');
        const deleteDirectory = fs.unlinkSync(dir);
        Promise.resolve(deleteDirectory);
        logger.green('Done removing previous bundle directory.');
      } else {
        Promise.resolve();
        logger.yellow('Bundle directory was not changed. Keeping...');
      }
    };

    const cleanBuilds = () => {
      fs.unlinkSync(path.join(dirname, 'ios/build/*'));
      fs.unlinkSync(path.join(dirname, 'android/.gradle/*'));
      fs.unlinkSync(path.join(dirname, 'android/app/build/*'));
      fs.unlinkSync(path.join(dirname, 'android/build/*'));
      Promise.resolve();
      logger.green('Done removing builds.');
    };

    const resolveBundleIdentifiers = (params) =>
      new Promise((resolve) => {
        let filePathsCount = 0;
        const {
          currentBundleID,
          newBundleID,
          newBundlePath,
          javaFileBase,
          currentJavaPath,
          newJavaPath
        } = params;
        bundleIdentifiers(
          currentAppName,
          newName,
          currentBundleID,
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
                    currentBundleID
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

    const rename = () => {
      resolveFoldersAndFiles
        .then(resolveFilesToModifyContent)
        .then(resolveJavaFiles)
        .then(resolveBundleIdentifiers)
        .then(deletePreviousBundleDirectory)
        .then(cleanBuilds)
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
