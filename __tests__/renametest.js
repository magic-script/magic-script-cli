jest.mock('../lib/rename/renamesteps');
jest.mock('../lib/rename/config/filesToModifyContent');
jest.mock('../lib/rename/config/foldersAndFiles');
jest.mock('fs');
jest.mock('path');
jest.mock('../lib/logger');

const renameSteps = require('../lib/rename/renamesteps');
const configFiles = require('../lib/rename/config/filesToModifyContent');
const foldersAndFiles = require('../lib/rename/config/foldersAndFiles');
const mockedFs = require('fs');
const mockedPath = require('path');
const mockedLogger = require('../lib/logger');
const rename = require('../lib/rename/rename');

afterEach(() => {
  jest.resetAllMocks();
});

describe('Test init utils methods', () => {
  test('should rename react native files', () => {
    const dirname = 'dirname';
    const newName = 'newName';
    const noSpaceNewName = newName;
    const newPackageName = 'com.new.package';
    const listOfFoldersAndFiles = ['folderAndFile'];
    const noSpaceCurrentAppName = 'Template';
    const listOfFilesToModifyContent = ['configFile'];
    const bundleID = newPackageName;
    const parameters = {};
    configFiles.filesToModifyContent.mockReturnValueOnce(
      listOfFilesToModifyContent
    );
    foldersAndFiles.foldersAndFiles.mockReturnValueOnce(listOfFoldersAndFiles);
    renameSteps.resolveJavaFiles.mockReturnValueOnce(parameters);
    mockedFs.existsSync.mockReturnValueOnce(true);

    rename.rename(dirname, newName, newPackageName);

    expect(renameSteps.resolveFoldersAndFiles).toHaveBeenCalledWith({
      listOfFoldersAndFiles,
      noSpaceCurrentAppName,
      noSpaceNewName,
      dirname
    });
    expect(renameSteps.resolveFilesToModifyContent).toHaveBeenCalledWith({
      listOfFilesToModifyContent,
      dirname,
      bundleID
    });
    expect(renameSteps.resolveBundleIdentifiers).toHaveBeenCalledWith(
      parameters
    );
    expect(renameSteps.deletePreviousBundleDirectory).toHaveBeenCalledWith(
      'com.magicscript.template'
    );
    expect(mockedLogger.green).toHaveBeenCalledWith(
      'APP SUCCESSFULLY RENAMED TO "newName"! 🎉 🎉 🎉'
    );
    expect(mockedPath.join).toHaveBeenCalledWith(dirname, 'ios', 'Podfile');
    expect(mockedLogger.yellow).toHaveBeenCalledWith(
      'Podfile has been modified, please run "pod install" inside ios directory.'
    );
    expect(mockedLogger.yellow).toHaveBeenCalledWith(
      'Please make sure to run "watchman watch-del-all" and "npm start --reset-cache" before running the app.'
    );
  });

  test('should not rename if new name is Template', () => {
    let newName = 'Template';
    const newPackageName = 'com.new.package';
    const dirname = 'dirname';

    rename.rename(dirname, newName, newPackageName);
    expect(mockedLogger.red).toHaveBeenCalledWith(
      'Please try a different name.'
    );

    newName = 'template';

    rename.rename(dirname, newName, newPackageName);
    expect(mockedLogger.red).toHaveBeenCalledWith(
      'Please try a different name.'
    );
  });
});
