jest.mock('../lib/rename/renameutils.js');
jest.mock('../lib/rename/config/bundleIdentifiers');
jest.mock('path');
jest.mock('fs');
jest.mock('../lib/logger.js');

let {
  copyFiles,
  copyFileOrDir,
  deleteFiles,
  replaceContent
} = require('../lib/rename/renameutils.js');
let { bundleIdentifiers } = require('../lib/rename/config/bundleIdentifiers');
let mockedPath = require('path');
let mockedFs = require('fs');
let mockedLogger = require('../lib/logger');
const renameSteps = require('../lib/rename/renamesteps');

afterEach(() => {
  jest.resetAllMocks();
});

describe('Test init utils methods', () => {
  test('should resolve folders and files', () => {
    const listOfFoldersAndFiles = ['file1'];
    const noSpaceCurrentAppName = 'appname';
    const noSpaceNewName = 'newname';
    const dirname = 'dirname';
    mockedPath.join.mockReturnValue('path');

    const params = {
      listOfFoldersAndFiles,
      noSpaceCurrentAppName,
      noSpaceNewName,
      dirname
    };

    renameSteps.resolveFoldersAndFiles(params);

    expect(copyFileOrDir).toHaveBeenCalledWith('path', 'path');
    expect(deleteFiles).toHaveBeenCalledWith('path');
  });

  test('should resolve files to modify content', () => {
    const regex = 'regex';
    const replacement = 'replacement';
    const paths = ['path'];
    const listOfFilesToModifyContent = [{ regex, replacement, paths }];
    const bundleID = 'com.bundle.id';
    const dirname = 'dirname';
    mockedPath.join.mockReturnValue('path');
    mockedFs.existsSync.mockReturnValueOnce(true);

    const params = {
      listOfFilesToModifyContent,
      dirname,
      bundleID
    };

    const result = renameSteps.resolveFilesToModifyContent(params);

    expect(replaceContent).toHaveBeenCalledWith(regex, replacement, ['path']);
    expect(result).toBe(bundleID);
  });

  test('should resolve java files', () => {
    const currentAppName = 'currName';
    const newName = 'newName';
    const newPackageName = 'com.new.name';
    const bundleID = 'com.new.name';
    const lowcaseNoSpaceNewAppName = 'newname';
    const templateBundleId = 'com.magicscript.template';
    let newJavaPath = 'com.new.name';
    const dirname = 'dirname';
    const params = {
      currentAppName,
      newName,
      newPackageName,
      bundleID,
      lowcaseNoSpaceNewAppName,
      templateBundleId,
      newJavaPath,
      dirname
    };
    newJavaPath = '/android/app/src/main/java/com/new/name';
    const newBundleID = newPackageName;

    mockedPath.join.mockReturnValue('path');
    mockedFs.existsSync.mockReturnValueOnce(false);

    const result = renameSteps.resolveJavaFiles(params);

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith('path', {
      recursive: true
    });
    expect(copyFiles).toHaveBeenCalledWith('path', 'path');
    expect(deleteFiles).toHaveBeenCalledWith('path');
    const expectedResult = {
      currentAppName,
      newName,
      templateBundleId,
      dirname,
      newBundleID,
      newJavaPath
    };
    expect(result).toEqual(expectedResult);
  });

  test('should resolve bundle identifiers', () => {
    const currentAppName = 'currName';
    const newName = 'newName';
    const templateBundleId = 'com.magicscript.template';
    const dirname = 'dirname';
    const newBundleID = 'com.new.name';
    const newJavaPath = '/android/app/src/main/java/com/new/name';
    const params = {
      currentAppName,
      newName,
      templateBundleId,
      dirname,
      newBundleID,
      newJavaPath
    };

    bundleIdentifiers.mockReturnValueOnce([
      {
        paths: ['path'],
        regex: 'regex',
        replacement: 'replacement'
      }
    ]);
    mockedPath.join.mockReturnValue('path');
    mockedFs.existsSync.mockReturnValueOnce(true);

    renameSteps.resolveBundleIdentifiers(params);

    expect(bundleIdentifiers).toHaveBeenCalledWith(
      currentAppName,
      newName,
      templateBundleId,
      newBundleID,
      newJavaPath
    );
    expect(replaceContent).toHaveBeenCalledWith('regex', 'replacement', [
      'path'
    ]);
  });

  test('should delete previous bundle directory', () => {
    renameSteps.deletePreviousBundleDirectory('com.previous.dir');

    expect(deleteFiles).toHaveBeenCalledWith('com/previous/dir');
    expect(mockedLogger.green).toHaveBeenCalledWith(
      'Done removing previous bundle directory.'
    );
  });
});
