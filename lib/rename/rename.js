import { copyFiles, copyFileOrDir, readFile, deleteFiles, replaceContent } from './renameutils';
import { bundleIdentifiers } from './config/bundleIdentifiers';
import { filesToModifyContent } from './config/filesToModifyContent';
import { foldersAndFiles } from './config/foldersAndFiles';
import path from 'path';
import logger from '../logger';
const templateAppName = 'Template';

// We are not validating name or package name at this point - it is validated when passing data via CLI in the first place.
module.exports.rename = function (newName, newPackageName) {
  readFile(path.join(__dirname, 'android/app/src/main/res/values/strings.xml'))
    .then(data => {
      const currentAppName = templateAppName;
      const noSpaceCurrentAppName = currentAppName.replace(/\s/g, '');
      const lowcaseNoSpaceCurrentAppName = noSpaceCurrentAppName.toLowerCase();
      const noSpaceNewName = newName.replace(/\s/g, '');
      const lowcaseNoSpaceNewAppName = noSpaceNewName.toLowerCase();
      const bundleID = newPackageName ? newPackageName.toLowerCase() : null;
      const listOfFoldersAndFiles = foldersAndFiles(currentAppName, newName);
      const listOfFilesToModifyContent = filesToModifyContent(currentAppName, newName, templateAppName);

      if (newName === currentAppName || newName === noSpaceCurrentAppName || newName === lowcaseNoSpaceCurrentAppName) {
        return logger.red('Please try a different name.');
      }

      // Move files and folders from ./config/foldersAndFiles.js
      const resolveFoldersAndFiles = new Promise(resolve => {
        listOfFoldersAndFiles.forEach((element, index) => {
          const dest = element.replace(new RegExp(noSpaceCurrentAppName, 'i'), noSpaceNewName);
          let itemsProcessed = 1;
          const successMsg = `/${dest} RENAMED`;

          setTimeout(() => {
            itemsProcessed += index;

            if (fs.existsSync(path.join(__dirname, element)) || !fs.existsSync(path.join(__dirname, element))) {
              console.log(`Resolve folders and files directory exists: ${path.join(__dirname, element)}`);
              copyFileOrDir(path.join(__dirname, element), path.join(__dirname, dest));
              deleteFiles(path.join(__dirname, element));
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
        new Promise(resolve => {
          let filePathsCount = 0;
          let itemsProcessed = 0;
          console.log(`Files to modify content: ${listOfFilesToModifyContent}`);
          listOfFilesToModifyContent.map(file => {
            filePathsCount += file.paths.length;

            file.paths.map((filePath, index) => {
              const newPaths = [];

              setTimeout(() => {
                itemsProcessed++;
                if (fs.existsSync(path.join(__dirname, filePath))) {
                  newPaths.push(path.join(__dirname, filePath));
                  replaceContent(file.regex, file.replacement, newPaths);
                }
                if (itemsProcessed === filePathsCount) {
                  resolve();
                }
              }, 200 * index);
            });
          });
        });

      const resolveJavaFiles = () =>
        new Promise(resolve => {
          readFile(path.join(__dirname, 'android/app/src/main/AndroidManifest.xml')).then(data => {
            const $ = cheerio.load(data);
            const currentBundleID = $('manifest').attr('package');
            const newBundleID = program.bundleID ? bundleID : `com.${lowcaseNoSpaceNewAppName}`;
            const javaFileBase = '/android/app/src/main/java';
            const newJavaPath = `${javaFileBase}/${newBundleID.replace(/\./g, '/')}`;
            const currentJavaPath = `${javaFileBase}/${currentBundleID.replace(/\./g, '/')}`;

            if (bundleID) {
              newBundlePath = newJavaPath;
            } else {
              newBundlePath = newBundleID.replace(/\./g, '/').toLowerCase();
              newBundlePath = `${javaFileBase}/${newBundlePath}`;
            }

            const fullCurrentBundlePath = path.join(__dirname, currentJavaPath);
            const fullNewBundlePath = path.join(__dirname, newBundlePath);

            // Create new bundle folder if doesn't exist yet
            if (!fs.existsSync(fullNewBundlePath)) {
              shell.mkdir('-p', fullNewBundlePath);
              copyFiles(fullCurrentBundlePath, fullNewBundlePath);
              deleteFiles(fullCurrentBundlePath);
              console.log(`${newBundlePath} ${colors.green('BUNDLE INDENTIFIER CHANGED')}`);
            }

            const vars = {
              currentBundleID,
              newBundleID,
              newBundlePath,
              javaFileBase,
              currentJavaPath,
              newJavaPath,
            };
            resolve(vars);
          });
        });

      const resolveBundleIdentifiers = params =>
        new Promise(resolve => {
          let filePathsCount = 0;
          const { currentBundleID, newBundleID, newBundlePath, javaFileBase, currentJavaPath, newJavaPath } = params;
          bundleIdentifiers(currentAppName, newName, projectName, currentBundleID, newBundleID, newBundlePath).map(
            file => {
              filePathsCount += file.paths.length - 1;
              let itemsProcessed = 0;

              file.paths.map((filePath, index) => {
                const newPaths = [];
                if (fs.existsSync(path.join(__dirname, filePath))) {
                  newPaths.push(path.join(__dirname, filePath));

                  setTimeout(() => {
                    itemsProcessed += index;
                    replaceContent(file.regex, file.replacement, newPaths);
                    if (itemsProcessed === filePathsCount) {
                      const oldBundleNameDir = path.join(__dirname, javaFileBase, currentBundleID);
                      resolve({ oldBundleNameDir, shouldDelete: currentJavaPath !== newJavaPath });
                    }
                  }, 200 * index);
                }
              });
            }
          );
        });

      const rename = () => {
        resolveFoldersAndFiles
          .then(resolveFilesToModifyContent)
          .then(resolveJavaFiles)
          .then(resolveBundleIdentifiers)
          .then(deletePreviousBundleDirectory)
          .then(cleanBuilds)
          .then(() => console.log(`APP SUCCESSFULLY RENAMED TO "${newName}"! 🎉 🎉 🎉`.green))
          .then(() => {
            if (fs.existsSync(path.join(__dirname, 'ios', 'Podfile'))) {
              console.log(
                `${colors.yellow('Podfile has been modified, please run "pod install" inside ios directory.')}`
              );
            }
          })
          .then(() =>
            console.log(
              `${colors.yellow(
                'Please make sure to run "watchman watch-del-all" and "npm start --reset-cache" before running the app. '
              )}`
            )
          );
      };

      rename();
    }
    );
};
