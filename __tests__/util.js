// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
jest.mock('fs');
jest.mock('glob');
const events = require('events');
const mockedFs = require('fs');
jest.spyOn(mockedFs, 'existsSync');
jest.spyOn(mockedFs, 'readFileSync');
const child_process = require('child_process');
jest.spyOn(child_process, 'exec');
jest.spyOn(child_process, 'execFile');
jest.spyOn(child_process, 'execSync');
jest.spyOn(child_process, 'spawn');
const util = require('../lib/util');

const consoleLog = console.log;
const consoleError = console.error;

beforeEach(() => {
  mockedFs.existsSync = jest.fn();
});

afterEach(() => {
  console.log = consoleLog;
  console.error = consoleError;
  jest.clearAllMocks();
  if (mockedFs.readFileSync.mock) {
    mockedFs.readFileSync.mockReset();
  }
});

describe('Test Util', () => {
  test('isInstalled error', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      return 'success';
    });
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe('mldb packages -j');
      cb('error');
    });
    expect(() => { util.isInstalled('com.abc', (result) => {}); }).toThrow();
  });

  test('isInstalled no match', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      return 'success';
    });
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe('mldb packages -j');
      cb(0, '[{"asdf":1 }]');
    });
    util.isInstalled('com.abc', function (result) {
      expect(result).toBeFalsy();
    });
  });

  test('isInstalled match', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      return 'success';
    });
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe('mldb packages -j');
      cb(0, '[{"package":"com.abc" }]');
    });
    util.isInstalled('com.abc', function (result) {
      expect(result).toBeTruthy();
    });
  });

  test('isInstalled parse error', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      return 'success';
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('Failed to parse packages JSON');
    });
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe('mldb packages -j');
      cb(0, null);
    });
    util.isInstalled('com.abc', function (result) {
      expect(result).toBeFalsy();
    });
  });

  test('findPackageName no manifest', () => {
    mockedFs.existsSync.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('manifest.xml doesn\'t exist in current directory');
    });
    let name = util.findPackageName();
    expect(mockedFs.existsSync).toHaveBeenCalled();
    expect(name).toBe('');
  });

  test('findPackageName manifest com.abc', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementationOnce((path, encoding) => {
      expect(path).toBe('manifest.xml');
      expect(encoding).toBe('utf8');
      return 'ml:package="com.abc"';
    });
    let name = util.findPackageName();
    expect(mockedFs.existsSync).toHaveBeenCalled();
    expect(mockedFs.readFileSync).toHaveBeenCalled();
    expect(name === 'com.abc').toBeTruthy();
  });

  test('findPackageName manifest null', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementationOnce((path) => {
      expect(path).toBe('manifest.xml');
      return null;
    });
    let name = util.findPackageName();
    expect(mockedFs.existsSync).toHaveBeenCalled();
    expect(mockedFs.readFileSync).toHaveBeenCalled();
    expect(name === '').toBeTruthy();
  });

  test('createDigest no sign script', () => {
    mockedFs.existsSync.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('Signing Script not available');
    });
    util.createDigest(false);
  });

  test('createDigest error signing', () => {
    mockedFs.existsSync.mockReturnValue(true);
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('error getting installed packages:');
    });
    child_process.execFile.mockImplementationOnce((node, command, cb) => {
      expect(command[0].endsWith('mxs-sign.js')).toBeTruthy();
      cb('err');
    });
    util.createDigest(false);
  });

  test('createDigest signing no error', () => {
    mockedFs.existsSync.mockReturnValue(true);
    jest.spyOn(console, 'log').mockImplementationOnce((data) => {
      expect(data).toBe('no error');
    });
    child_process.execFile.mockImplementationOnce((node, command, cb) => {
      expect(command[0].endsWith('mxs-sign.js')).toBeTruthy();
      cb(null, 'no error');
    });
    util.createDigest(false);
  });

  test('startMLDB no error string', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      return 'success';
    });
    expect(() => { util.startMLDB() }).not.toThrow();
  });

  test('startMLDB no error object', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      return { 'success': true };
    });
    expect(() => { util.startMLDB() }).not.toThrow();
  });

  test('startMLDB error', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      throw new Error('oops');
    });
    expect(() => { util.startMLDB() }).toThrow();
  });

  test('isValidPackageId success', () => {
    expect(util.isValidPackageId('com.test')).toBe(true);
  });

  test('isValidPackageId fail', () => {
    expect(util.isValidPackageId('com.#!@#test')).toBe(false);
  });

  test('isValidFolderName success', () => {
    expect(util.isValidFolderName('testapp')).toBe(true);
  });

  test('isValidFolderName fail', () => {
    expect(util.isValidFolderName('com.#!@#te st')).toBe(false);
  });

  test('copy files where stat is not directory', () => {
    jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
      return ['file1', 'file2'];
    });
    jest.spyOn(mockedFs, 'statSync').mockImplementation((path) => {
      var statObject = {};
      statObject.isFile = function () { return true; };
      statObject.isDirectory = function () { return false; };
      return statObject;
    });
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return 'test1';
    }).mockImplementationOnce(() => {
      return 'test2';
    });
    jest.spyOn(mockedFs, 'writeFileSync').mockImplementationOnce((path, contents, type) => {
      expect(contents).toBe('test1');
      expect(path.endsWith('file1')).toBeTruthy();
    }).mockImplementationOnce((path, contents, type) => {
      expect(contents).toBe('test2');
      expect(path.endsWith('file2')).toBeTruthy();
    });
    // mock for copy manifest
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return 'test1';
    });
    util.copyComponentsFiles('test', 'test');
  });

  test('copy files where stat is a directory', () => {
    jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce(() => {
      return ['dir1', 'dir2'];
    }).mockImplementation(() => {
      return [];
    });
    jest.spyOn(mockedFs, 'existsSync').mockImplementation(() => {
      return true;
    });
    jest.spyOn(mockedFs, 'statSync').mockImplementation(() => {
      var statObject = {};
      statObject.isFile = function () { return false; };
      statObject.isDirectory = function () { return true; };
      return statObject;
    });
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return 'test1';
    });
    // mock for copy manifest
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return 'test1';
    });
    util.copyComponentsFiles('test', 'test');
  });

  test('remove files where stat is not directory', () => {
    jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
      return ['file1', 'file2'];
    });
    jest.spyOn(mockedFs, 'lstatSync').mockImplementation((path) => {
      var statObject = {};
      statObject.isFile = function () { return true; };
      statObject.isDirectory = function () { return false; };
      return statObject;
    });
    jest.spyOn(mockedFs, 'unlinkSync').mockImplementationOnce((path, contents, type) => {
      expect(path.endsWith('file1')).toBeTruthy();
    }).mockImplementationOnce((path, contents, type) => {
      expect(path.endsWith('file2')).toBeTruthy();
    });
    jest.spyOn(mockedFs, 'rmdirSync').mockImplementationOnce((path) => {
      expect(path.endsWith('path')).toBeTruthy();
    });
    util.removeFilesRecursively('path');
  });

  test('remove files where stat is a directory', () => {
    jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce(() => {
      return ['dir1', 'dir2'];
    }).mockImplementation(() => {
      return [];
    });
    jest.spyOn(mockedFs, 'lstatSync').mockImplementation((path) => {
      var statObject = {};
      statObject.isFile = function () { return false; };
      statObject.isDirectory = function () { return true; };
      return statObject;
    });
    jest.spyOn(mockedFs, 'rmdirSync').mockImplementation((path) => {
      expect(path.startsWith('path/dir') || path === 'path').toBeTruthy();
    });
    util.removeFilesRecursively('path');
  });

  test('should navigate to lumin if lumin folder exists', () => {
    process.chdir = jest.fn();
    mockedFs.existsSync.mockReturnValueOnce(true);
    util.navigateIfComponents();
    expect(process.chdir).toHaveBeenCalledWith('lumin');
  });

  test('should not navigate to lumin if lumin folder does not exist', () => {
    process.chdir = jest.fn();
    mockedFs.existsSync.mockReturnValueOnce(false);
    util.navigateIfComponents();
    expect(process.chdir).not.toHaveBeenCalledWith('test');
  });

  test('create android local properties file if does not exist', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    process.env.ANDROID_HOME = 'test';
    jest.spyOn(mockedFs, 'writeFileSync').mockImplementationOnce((path, content) => {
      expect(path.endsWith('android/local.properties')).toBeTruthy();
      expect(content).toBe('sdk.dir=test');
    });
    util.createAndroidLocalProperties();
  });

  test('create android local properties file if does not exist Windows', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    process.env.ANDROID_HOME = 'test';
    Object.defineProperty(process, 'platform', { value: 'win32' });
    jest.spyOn(mockedFs, 'writeFileSync').mockImplementationOnce((path, content) => {
      expect(path.endsWith('android/local.properties')).toBeTruthy();
      expect(content).toBe('sdk.dir=test');
    });
    util.createAndroidLocalProperties();
  });

  test('android local properties and ANDROID_HOME missing', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    delete process.env.ANDROID_HOME;
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    util.createAndroidLocalProperties();
  });

  test('should not create android local properties file if file exists', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    jest.spyOn(mockedFs, 'writeFileSync');
    util.createAndroidLocalProperties();
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
  });

  test('should rename files of the project based on package name and project name', () => {
    let manifest = 'test1';
    process.cwd = jest.fn().mockReturnValue('cwd');
    mockedFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(true);
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return manifest;
    });
    mockedFs.writeFileSync.mockImplementationOnce((path, result, type) => {
      expect(path).toBe('cwd/name/lumin/manifest.xml');
      expect(result).toBe('test1');
      expect(type).toBe('utf8');
    });
    util.renameComponentsFiles('name', 'package', 'visiblename');
  });

  test('should rename files of the project based on project name', () => {
    let manifest = 'test1';
    process.cwd = jest.fn().mockReturnValue('cwd');
    mockedFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(true);
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return manifest;
    });
    mockedFs.writeFileSync.mockImplementationOnce((path, result, type) => {
      expect(path).toBe('cwd/name/lumin/manifest.xml');
      expect(result).toBe('test1');
      expect(type).toBe('utf8');
    });
    jest.spyOn(child_process, 'spawnSync').mockReturnValueOnce(true);
    util.renameComponentsFiles('name', null, 'name');
  });

  test('should rename files of the project based on project name 2', () => {
    let manifest = 'test1';
    process.cwd = jest.fn().mockReturnValue('cwd');
    mockedFs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValueOnce(true);
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return manifest;
    });
    mockedFs.writeFileSync.mockImplementationOnce((path, result, type) => {
      expect(path).toBe('cwd/name/reactnative/ios/name.xcodeproj/projectt.pbxproj');
      // console.trace('test2 instead of test1');
      expect(result).toBe('test1');
      expect(type).toBe('utf8');
    });
    jest.spyOn(child_process, 'spawnSync').mockReturnValueOnce(true);
    util.renameComponentsFiles('name', 'test1', 'name');
  });

  test('should return early without visibleName', () => {
    util.renameComponentsFiles('name');
    expect(mockedFs.existsSync).not.toHaveBeenCalled();
    expect(mockedFs.renameSync).not.toHaveBeenCalled();
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    expect(mockedFs.readFileSync).not.toHaveBeenCalled();
  });

  test('should not rename due to missing lumin and reactnative', () => {
    process.cwd = jest.fn().mockReturnValue('cwd');
    mockedFs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);
    util.renameComponentsFiles('name', null, 'name');
    expect(mockedFs.renameSync).not.toHaveBeenCalled();
    expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    expect(mockedFs.readFileSync).not.toHaveBeenCalled();
  });

  test('validatePackageId success', () => {
    expect(util.validatePackageId('test.app')).toBe(true);
  });

  test('validatePackageId fail', () => {
    expect(util.validatePackageId('com.#!@#te st')).toBe('Invalid package ID. Must match /^(?=.{3,30}$)(?=.*[.])[a-zA-Z0-9]+(?:[.][a-zA-Z0-9]+)*$/');
  });

  test('validateFolderName success', () => {
    expect(util.validateFolderName('testapp')).toBe(true);
  });

  test('validateFolderName fail', () => {
    expect(util.validateFolderName('com.#!@#te st')).toBe('Invalid folder name. Must match /^(?:[A-Za-z\\-_\\d])+$|^\\.$/');
  });

  test('should fail install with on error', () => {
    jest.spyOn(util, 'findPackageName').mockReturnValueOnce('testPackage');
    jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName).toBe('testPackage');
      callback();
    });
    const emitter = new events.EventEmitter();
    const childEmitter = new events.EventEmitter();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('mldb');
      expect(commandArgs).toStrictEqual(['install', 'testPath']);
      childEmitter.stdout = emitter.on('data', () => {});
      childEmitter.stderr = emitter.on('data', (err) => { throw err; });
      childEmitter.on('error', () => { });
      return childEmitter;
    });
    util.installPackage({ target: 'lumin', path: 'testPath' });
    expect(() => { childEmitter.emit('error'); }).toThrow();
  });

  test('should succeed install with stdout, stderr data', () => {
    jest.spyOn(util, 'findPackageName').mockReturnValueOnce('testPackage');
    jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName).toBe('testPackage');
      callback();
    });
    const emitter = new events.EventEmitter();
    const childEmitter = {};
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('mldb');
      expect(commandArgs).toStrictEqual(['install', 'testPath']);
      childEmitter.stdout = emitter.on('data', () => {});
      childEmitter.stderr = emitter.on('data', () => {});
      childEmitter.on = ('error', () => { });
      return childEmitter;
    });
    util.installPackage({ target: 'lumin', path: 'testPath' });
    emitter.emit('data');
  });

  test('findMPK missing app.package', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    let path = util.findMPKPath();
    expect(path).toStrictEqual('');
  });

  test('findMPK mpk path not found', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mabu -t device --print-package-outputs app.package');
      return 'test';
    });
    let path = util.findMPKPath();
    expect(path).toStrictEqual('');
  });

  test('findMPK found mpk path', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mabu -t device --print-package-outputs app.package');
      return 'asd\tb.mpk';
    });
    let path = util.findMPKPath();
    expect(path).toStrictEqual('b.mpk');
  });
});
