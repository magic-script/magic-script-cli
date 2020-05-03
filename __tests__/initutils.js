jest.mock('fs');
jest.mock('../lib/util');
jest.mock('../lib/logger');
jest.mock('child_process');

const child_process = require('child_process');
jest.spyOn(child_process, 'spawnSync');

const mockedFs = require('fs');
const util = require('../lib/util');
const initUtil = require('../lib/initutils');
const logger = require('../lib/logger');

afterEach(() => {
  jest.resetAllMocks();
});

describe('Test init utils methods', () => {

  function createStat(isFile, isDirectory) {
    var statObject = {};
    statObject.isFile = function () { return isFile; };
    statObject.isDirectory = function () { return isDirectory; };
    return statObject;
  }

  test('should update manifest package id in manifest file', () => {
    let result = initUtil.updateManifest('com.magicleap.magicscript.hello-sample', 'com.test.sample', 'name', false);
    expect(result).toBe('com.test.sample');
  });

  test('should update manifest visible name in manifest file', () => {
    let result = initUtil.updateManifest('MagicScript Hello Sample', 'com.test.sample', 'test name', false);
    expect(result).toBe('test name');
  });

  test('should update manifest to fullscreen if is immersive', () => {
    let result = initUtil.updateManifest('universe', 'com.test.sample', 'test name', true);
    expect(result).toBe('fullscreen');
  });

  test('should update manifest to Fullscreen if is immersive', () => {
    let result = initUtil.updateManifest('Universe', 'com.test.sample', 'test name', true);
    expect(result).toBe('Fullscreen');
  });

  test('should update components manifest to fullscreen if universe is there', () => {
    let result = initUtil.updateComponentManifest('universe');
    expect(result).toBe('fullscreen');
  });

  test('should update components manifest to Fullscreen if Universe is there', () => {
    let result = initUtil.updateComponentManifest('Universe');
    expect(result).toBe('Fullscreen');
  });

  test('should update components manifest privileges', () => {
    let result = initUtil.updateComponentManifest('<uses-privilege ml:name="MagicScript"/>');
    expect(result).toBe('<uses-privilege ml:name="LowLatencyLightwear"/>\n    <uses-privilege ml:name="MagicScript"/>');
  });

  test('should update manifest privileges if is immersive', () => {
    let result = initUtil.updateManifest('<uses-privilege ml:name="MagicScript"/>', 'com.test.sample', 'test name', true);
    expect(result).toBe('<uses-privilege ml:name="LowLatencyLightwear"/>\n    <uses-privilege ml:name="MagicScript"/>');
  });

  test('should create directory if does not exist when copying vanilla files', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    mockedFs.readdirSync.mockReturnValueOnce([]);
    
    initUtil.copyVanillaFiles('srcPath', 'dstPath', false, 'com.test.app', 'visibleName');

    expect(mockedFs.existsSync).toHaveBeenCalledWith('dstPath');
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith('dstPath');
  });

  test('should create directory if does not exist when copying components files', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    mockedFs.readdirSync.mockReturnValueOnce([]);
    
    initUtil.copyComponentFiles('srcPath', 'dstPath', false, '');

    expect(mockedFs.existsSync).toHaveBeenCalledWith('dstPath');
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith('dstPath');
  });

  test('should copy components manifest file with updated privilege when is immersive', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['manifest.xml', 'file']);
    mockedFs.statSync.mockReturnValueOnce(createStat(true, false)).mockReturnValueOnce(createStat(true, false));
    mockedFs.readFileSync.mockReturnValueOnce('<uses-privilege ml:name="MagicScript"/>').mockReturnValueOnce('fileContent');
    
    initUtil.copyComponentFiles('srcPath', 'dstPath', true, '');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(1, 'srcPath/manifest.xml');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(2, 'srcPath/file');
    
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(1, 'srcPath/manifest.xml', 'utf8');
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(2, 'srcPath/file');

    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(1, 'dstPath/manifest.xml', '<uses-privilege ml:name="LowLatencyLightwear"/>\n    <uses-privilege ml:name="MagicScript"/>', 'utf8');
    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(2, 'dstPath/file', 'fileContent');
  });

  test('should change main.js or main.tsx file from landscape to immersive when is immersive', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['main.js', 'main.tsx']);
    mockedFs.statSync.mockReturnValueOnce(createStat(true, false)).mockReturnValueOnce(createStat(true, false));
    mockedFs.readFileSync.mockReturnValueOnce('landscape').mockReturnValueOnce('landscape');
    
    initUtil.copyComponentFiles('srcPath', 'dstPath', true, '');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(1, 'srcPath/main.js');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(2, 'srcPath/main.tsx');
    
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(1, 'srcPath/main.js', 'utf8');
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(2, 'srcPath/main.tsx', 'utf8');

    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(1, 'dstPath/main.js', 'immersive', 'utf8');
    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(2, 'dstPath/main.tsx', 'immersive', 'utf8');
  });

  test('should change lumin icon portal package name when copying component files', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['portal.kmat', 'portal.fbx']);
    mockedFs.statSync.mockReturnValueOnce(createStat(true, false)).mockReturnValueOnce(createStat(true, false));
    mockedFs.readFileSync.mockReturnValueOnce('com_magicscript_template').mockReturnValueOnce('com_magicscript_template');
    
    initUtil.copyComponentFiles('srcPath', 'dstPath', true, 'org.test.package');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(1, 'srcPath/portal.kmat');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(2, 'srcPath/portal.fbx');
    
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(1, 'srcPath/portal.kmat', 'utf8');
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(2, 'srcPath/portal.fbx', 'utf8');

    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(1, 'dstPath/portal.kmat', 'org_test_package', 'utf8');
    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(2, 'dstPath/portal.fbx', 'org_test_package', 'utf8');
  });

  test('should change lumin icon model package name when copying component files', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['model.kmat', 'model.fbx']);
    mockedFs.statSync.mockReturnValueOnce(createStat(true, false)).mockReturnValueOnce(createStat(true, false));
    mockedFs.readFileSync.mockReturnValueOnce('com_magicscript_template').mockReturnValueOnce('com_magicscript_template');
    
    initUtil.copyComponentFiles('srcPath', 'dstPath', true, 'org.test.package');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(1, 'srcPath/model.kmat');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(2, 'srcPath/model.fbx');
    
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(1, 'srcPath/model.kmat', 'utf8');
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(2, 'srcPath/model.fbx', 'utf8');

    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(1, 'dstPath/model.kmat', 'org_test_package', 'utf8');
    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(2, 'dstPath/model.fbx', 'org_test_package', 'utf8');
  });

  test('should change lumin icon portal package name when copying vanilla files', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['portal.kmat', 'portal.fbx']);
    mockedFs.statSync.mockReturnValueOnce(createStat(true, false)).mockReturnValueOnce(createStat(true, false));
    mockedFs.readFileSync.mockReturnValueOnce('com_magicleap_magicscript_hello-sample').mockReturnValueOnce('com_magicleap_magicscript_hello-sample');
    
    initUtil.copyVanillaFiles('srcPath', 'dstPath', false, 'com.test.app', 'visibleName');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(1, 'srcPath/portal.kmat');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(2, 'srcPath/portal.fbx');
    
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(1, 'srcPath/portal.kmat', 'utf8');
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(2, 'srcPath/portal.fbx', 'utf8');

    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(1, 'dstPath/portal.kmat', 'com_test_app', 'utf8');
    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(2, 'dstPath/portal.fbx', 'com_test_app', 'utf8');
  });

  test('should change lumin icon model package name when copying vanilla files', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['model.kmat', 'model.fbx']);
    mockedFs.statSync.mockReturnValueOnce(createStat(true, false)).mockReturnValueOnce(createStat(true, false));
    mockedFs.readFileSync.mockReturnValueOnce('com_magicleap_magicscript_hello-sample').mockReturnValueOnce('com_magicleap_magicscript_hello-sample');
    
    initUtil.copyVanillaFiles('srcPath', 'dstPath', false, 'com.test.app', 'visibleName');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(1, 'srcPath/model.kmat');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(2, 'srcPath/model.fbx');
    
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(1, 'srcPath/model.kmat', 'utf8');
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(2, 'srcPath/model.fbx', 'utf8');

    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(1, 'dstPath/model.kmat', 'com_test_app', 'utf8');
    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(2, 'dstPath/model.fbx', 'com_test_app', 'utf8');
  });

  test('should run recursively when its directory when copying components files', () => {
    mockedFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['directory']).mockReturnValueOnce([]);
    mockedFs.statSync.mockReturnValueOnce(createStat(false, true));
    
    initUtil.copyComponentFiles('srcPath', 'dstPath', true, '');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenCalledWith('srcPath/directory');

    expect(mockedFs.existsSync).toHaveBeenNthCalledWith(1, 'dstPath');
    expect(mockedFs.existsSync).toHaveBeenNthCalledWith(2, 'dstPath/directory');
  });

  test('should copy manifest file with new package id', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['manifest.xml', 'file']);
    mockedFs.statSync
      .mockReturnValueOnce(createStat(true, false))
      .mockReturnValueOnce(createStat(true, false));
    mockedFs.readFileSync
      .mockReturnValueOnce('com.magicleap.magicscript.hello-sample')
      .mockReturnValueOnce('srcPath/manifest.xml', 'utf8')
      .mockReturnValueOnce('fileContent', 'utf8')
      .mockReturnValueOnce('fileContent');
    
    initUtil.copyVanillaFiles('srcPath', 'dstPath', false, 'com.test.app', 'visibleName');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(1, 'srcPath/manifest.xml');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(2, 'srcPath/file');
    
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(1, 'srcPath/manifest.xml', 'utf8');
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(2, 'srcPath/file', 'utf8');
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(3, 'srcPath/file');

    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(1, 'dstPath/manifest.xml', 'com.test.app', 'utf8');
    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(2, 'dstPath/file', 'fileContent');
  });

  test('should replace app content file when is immersive', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['app.js', 'file']);
    mockedFs.statSync
      .mockReturnValueOnce(createStat(true, false))
      .mockReturnValueOnce(createStat(true, false));
    mockedFs.readFileSync
      .mockReturnValueOnce('LandscapeApp')
      .mockReturnValueOnce('fileContent')
      .mockReturnValueOnce('fileContent');
    
    initUtil.copyVanillaFiles('srcPath', 'dstPath', true, 'com.test.app', 'visibleName');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(1, 'srcPath/app.js');
    expect(mockedFs.statSync).toHaveBeenNthCalledWith(2, 'srcPath/file');
    
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(1, 'srcPath/app.js', 'utf8');
    expect(mockedFs.readFileSync).toHaveBeenNthCalledWith(2, 'srcPath/file', 'utf8');

    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(1, 'dstPath/app.js', 'ImmersiveApp', 'utf8');
    expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(2, 'dstPath/file', 'fileContent');
    // expect(mockedFs.writeFileSync).toHaveBeenNthCalledWith(1, 'dstPath/file', 'fileContent', 'utf8');
  });

  test('should run recursively when its directory', () => {
    mockedFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true);
    mockedFs.readdirSync.mockReturnValueOnce(['directory']).mockReturnValueOnce([]);
    mockedFs.statSync.mockReturnValueOnce(createStat(false, true));
    
    initUtil.copyVanillaFiles('srcPath', 'dstPath', true, 'com.test.app', 'visibleName');

    expect(mockedFs.readdirSync).toHaveBeenCalledWith('srcPath');
    expect(mockedFs.statSync).toHaveBeenCalledWith('srcPath/directory');

    expect(mockedFs.existsSync).toHaveBeenNthCalledWith(1, 'dstPath');
    expect(mockedFs.existsSync).toHaveBeenNthCalledWith(2, 'dstPath/directory');
  });

  test('should remove files recursively for android if android is not specified', () => {
    let path = 'path';
    mockedFs.existsSync.mockReturnValueOnce(true);
    
    initUtil.preparePlatforms(path, ['IOS', 'LUMIN']);
    
    expect(mockedFs.existsSync).toHaveBeenCalledWith('path/reactnative/android');
    expect(util.removeFilesRecursively).toHaveBeenCalledWith('path/reactnative/android');
  });

  test('should remove files recursively for ios if ios is not specified', () => {
    let path = 'path';
    mockedFs.existsSync.mockReturnValueOnce(true);
    
    initUtil.preparePlatforms(path, ['ANDROID', 'LUMIN']);
    
    expect(mockedFs.existsSync).toHaveBeenCalledWith('path/reactnative/ios');
    expect(util.removeFilesRecursively).toHaveBeenCalledWith('path/reactnative/ios');
  });

  test('should remove files recursively for lumin if lumin is not specified', () => {
    let path = 'path';
    mockedFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true);
    
    initUtil.preparePlatforms(path, ['ANDROID', 'IOS']);
    
    expect(mockedFs.existsSync).toHaveBeenCalledWith('path/lumin');
    expect(util.removeFilesRecursively).toHaveBeenCalledWith('path/lumin');
  });

  test('should create android local properties if android is specified', () => {
    let path = 'path';
    mockedFs.existsSync.mockReturnValueOnce(true);
    
    initUtil.preparePlatforms(path, ['ANDROID', 'IOS']);
    
    expect(mockedFs.existsSync).toHaveBeenCalledWith('path/reactnative/android/local.properties');
  });

  test('should remove whole reactnative directory is neither android nor ios is specified ', () => {
    let path = 'path';
    mockedFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(true);
    
    initUtil.preparePlatforms(path, ['LUMIN']);
    
    expect(util.removeFilesRecursively).toHaveBeenNthCalledWith(1, 'path/reactnative/ios');
    expect(util.removeFilesRecursively).toHaveBeenNthCalledWith(2, 'path/reactnative/android');
    expect(util.removeFilesRecursively).toHaveBeenNthCalledWith(3, 'path/reactnative');
  });

  test('should return true if is components option is enabled', () => {
    let result = initUtil.isComponentsAppType({
      ISCOMPONENTS: true
    });
    expect(result).toBe(true);
  });

  test('should create symlink and return true if its successful', () => {
    let result = initUtil.createSymlink('curDir', 'folderName');
    
    expect(mockedFs.symlinkSync).toHaveBeenCalledWith('../assets', 'curDir/folderName/reactnative/assets', 'dir');
    expect(result).toBe(true);
  });

  test('should not create symlink and return false if create symlink throws error', () => {
    mockedFs.symlinkSync.mockImplementation(() => {
      throw new Error();
    });
    let result = initUtil.createSymlink('curDir', 'folderName');
    
    expect(mockedFs.symlinkSync).toHaveBeenCalledWith('../assets', 'curDir/folderName/reactnative/assets', 'dir');
    expect(result).toBe(false);
  });

  test('should unlink main.js and app.js for typescript preparation', () => {
    initUtil.prepareTypescript('curDir', 'folder');
    
    expect(mockedFs.unlinkSync).toHaveBeenNthCalledWith(1, 'curDir/folder/src/main.js');
    expect(mockedFs.unlinkSync).toHaveBeenNthCalledWith(2, 'curDir/folder/src/app.js');
  });

  test('should unlink main.js from lumin directory and app.js from src directory for typescript components preparation', () => {
    initUtil.prepareComponentsTypescript('curDir', 'folder');
    
    expect(mockedFs.unlinkSync).toHaveBeenNthCalledWith(1, 'curDir/folder/lumin/src/main.js');
    expect(mockedFs.unlinkSync).toHaveBeenNthCalledWith(2, 'curDir/folder/src/app.js');
  });

  test('create android local properties file if does not exist', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    process.env.ANDROID_HOME = 'test';
    jest.spyOn(mockedFs, 'writeFileSync').mockImplementationOnce((path, content) => {
      expect(path.endsWith('android/local.properties')).toBeTruthy();
      expect(content).toBe('sdk.dir=test');
    });
    initUtil.createAndroidLocalProperties();
  });

  test('create android local properties file if does not exist Windows', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    process.env.ANDROID_HOME = 'test';
    Object.defineProperty(process, 'platform', { value: 'win32' });
    jest.spyOn(mockedFs, 'writeFileSync').mockImplementationOnce((path, content) => {
      expect(path.endsWith('android/local.properties')).toBeTruthy();
      expect(content).toBe('sdk.dir=test');
    });
    initUtil.createAndroidLocalProperties();
  });

  test('android local properties and ANDROID_HOME missing', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    delete process.env.ANDROID_HOME;
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    initUtil.createAndroidLocalProperties();
  });

  test('should not create android local properties file if file exists', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    jest.spyOn(mockedFs, 'writeFileSync');
    initUtil.createAndroidLocalProperties();
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });

  test('should log error when visible name is not set', () => {
    initUtil.renameComponentsFiles('folderName', 'packageName');

    expect(logger.red).toHaveBeenCalledWith('You have to specify the project name to rename the project!');
  });

  test('should change visible name and package name in manifest if it exists', () => {
    process.cwd = jest.fn().mockReturnValue('cwd');
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readFileSync.mockReturnValueOnce('ml:visible_name="example" \n ml:package="com.example"');

    initUtil.renameComponentsFiles('folderName', 'packageName', 'visibleName', ['LUMIN']);
    
    expect(logger.green).toHaveBeenNthCalledWith(1, 'new project name: visibleName');
    expect(logger.green).toHaveBeenNthCalledWith(2, 'Lumin manifest file has been updated successfully');
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith('cwd/folderName/lumin/manifest.xml', 'ml:visible_name="visibleName" \n ml:package="packageName"', 'utf8');
  });

  test('should change only visible name in manifest if package name is null', () => {
    process.cwd = jest.fn().mockReturnValue('cwd');
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readFileSync.mockReturnValueOnce('ml:visible_name="example" \n ml:package="com.example"');

    initUtil.renameComponentsFiles('folderName', null, 'visibleName', ['LUMIN']);
    
    expect(logger.green).toHaveBeenNthCalledWith(1, 'new project name: visibleName');
    expect(logger.green).toHaveBeenNthCalledWith(2, 'Lumin manifest file has been updated successfully');
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith('cwd/folderName/lumin/manifest.xml', 'ml:visible_name="visibleName" \n ml:package="com.example"', 'utf8');
  });

  test('should rename react native files', () => {
    process.cwd = jest.fn().mockReturnValue('cwd');
    mockedFs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
    child_process.spawnSync.mockImplementationOnce((path, args, settings) => {
      let expectedSettings = {"cwd": "cwd/folderName/reactnative", "stdio": "inherit"}
      expect(args).toStrictEqual(["visibleName", "-b", "packageName"]);
      expect(settings).toEqual(expect.objectContaining(expectedSettings));
      return true;
    });

    initUtil.renameComponentsFiles('folderName', 'packageName', 'visibleName', ['ANDROID']);
    
    expect(mockedFs.existsSync).toHaveBeenNthCalledWith(1, 'cwd/folderName/lumin/manifest.xml');
    expect(mockedFs.existsSync).toHaveBeenNthCalledWith(2, 'cwd/folderName/reactnative');
    expect(logger.green).toHaveBeenCalledWith('Prepare project name and package in the project...');
    expect(child_process.spawnSync).toHaveBeenCalled();
  });

  test('should not rename files if package or folderName does not exist', () => {
    mockedFs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);

    initUtil.renameComponentsFiles(null, null, 'visibleName', ['ANDROID']);

    expect(logger.yellow).toHaveBeenCalledWith('Renaming of the project could not be processed because the path does not exist!');
  });
});