/* eslint-disable no-trailing-spaces */
// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
jest.mock('fs');
jest.mock('../lib/consts');

const inquirer = require('inquirer');
const mockedFs = require('fs');
const init = require('../commands/init');
const util = require('../lib/util');
const consts = require('../lib/consts');

jest.spyOn(mockedFs, 'existsSync');
jest.spyOn(mockedFs, 'readFileSync');

let backup;

beforeEach(() => {
  mockedFs.existsSync = jest.fn();
});

afterEach(() => {
  inquirer.prompt = backup;
});

function mockCopyComponentsFiles () {
  // copy component files
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
    expect(type).not.toBe('utf8');
    expect(contents).toBe('test1');
    expect(path.endsWith('file1')).toBeTruthy();
  }).mockImplementationOnce((path, contents, type) => {
    expect(type).not.toBe('utf8');
    expect(contents).toBe('test2');
    expect(path.endsWith('file2')).toBeTruthy();
  });
  // mock for copy manifest
  mockedFs.readFileSync.mockImplementationOnce(() => {
    return 'test1';
  });
}

function mockRemovePackageJsons () {
  // remove package jsons
  jest.spyOn(mockedFs, 'unlinkSync').mockImplementationOnce((file) => {
    expect(file.endsWith('package.lumin.json')).toBeTruthy();
  }).mockImplementationOnce((file) => {
    expect(file.endsWith('package.reactnative.json')).toBeTruthy();
  }).mockImplementationOnce((file) => {
    expect(file.endsWith('package.allplatforms.json')).toBeTruthy();
  });
}

describe('Test Components configurations', () => {
  describe('Test Components configurations', () => {
    test('create components project for lumin if target is not specified and apptype is Components', () => {
      mockedFs.existsSync.mockReturnValue(true);
      consts.reactFiles = ['react'];
      // remove packages not specified by target
      jest.spyOn(mockedFs, 'rmdirSync').mockImplementationOnce(path => {
        expect(path.endsWith('ios')).toBeTruthy();
      }).mockImplementationOnce(path => {
        expect(path.endsWith('android')).toBeTruthy();
      });
      mockCopyComponentsFiles();
      // rename lumin package json
      jest.spyOn(mockedFs, 'renameSync').mockImplementationOnce((firstFilename, secondFilename) => {
        expect(firstFilename.endsWith('package.lumin.json')).toBeTruthy();
        expect(secondFilename.endsWith('package.json')).toBeTruthy();
      });
      // remove react files
      jest.spyOn(mockedFs, 'unlinkSync').mockImplementationOnce((file) => {
        expect(file.endsWith('react')).toBeTruthy();
      });
      mockRemovePackageJsons();
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Components',
        FOLDERNAME: 'ComponentsLumin',
        APPID: 'com.test.0'
      });
      init({ '_': ['init'] });
    });
    test('create components project for lumin if target is lumin and apptype is Components', () => {
      mockedFs.existsSync.mockReturnValue(true);
      consts.reactFiles = ['react'];
      // remove packages not specified by target
      jest.spyOn(mockedFs, 'rmdirSync').mockImplementationOnce(path => {
        expect(path.endsWith('ios')).toBeTruthy();
      }).mockImplementationOnce(path => {
        expect(path.endsWith('android')).toBeTruthy();
      });
      mockCopyComponentsFiles();
      // rename lumin package json
      jest.spyOn(mockedFs, 'renameSync').mockImplementationOnce((firstFilename, secondFilename) => {
        expect(firstFilename.endsWith('package.lumin.json')).toBeTruthy();
        expect(secondFilename.endsWith('package.json')).toBeTruthy();
      });
      // remove react files
      jest.spyOn(mockedFs, 'unlinkSync').mockImplementationOnce((file) => {
        expect(file.endsWith('react')).toBeTruthy();
      });
      mockRemovePackageJsons();
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Components',
        FOLDERNAME: 'ComponentsLumin',
        APPID: 'com.test.0',
        TARGET: ['lumin']
      });
      init({ '_': ['init'] });
    });

    test('create components project for android if target is android and apptype is Components', () => {
      mockedFs.existsSync.mockReturnValue(true);
      consts.luminFiles = ['lumin'];
      util.createAndroidLocalProperties = jest.fn('path');

      // remove packages not specified by target
      jest.spyOn(mockedFs, 'rmdirSync').mockImplementationOnce(path => {
        expect(path.endsWith('ios')).toBeTruthy();
      }).mockImplementationOnce(path => {
        expect(path.endsWith('lumin')).toBeTruthy();
      });
      mockCopyComponentsFiles();
      // create android local.properties file
      const localPropertiesSpy = jest.spyOn(util, 'createAndroidLocalProperties').mockImplementationOnce(path => {
        expect(localPropertiesSpy).toHaveBeenCalled();
      });
      // rename react package json
      jest.spyOn(mockedFs, 'renameSync').mockImplementationOnce((firstFilename, secondFilename) => {
        expect(firstFilename.endsWith('package.reactnative.json')).toBeTruthy();
        expect(secondFilename.endsWith('package.json')).toBeTruthy();
      });
      // remove lumin files
      jest.spyOn(mockedFs, 'unlinkSync').mockImplementationOnce((file) => {
        expect(file.endsWith('lumin')).toBeTruthy();
      });
      mockRemovePackageJsons();
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Components',
        FOLDERNAME: 'ComponentsAndroid',
        APPID: 'com.test.0',
        TARGET: ['Android']
      });
      init({ '_': ['init'] });
    });
    test('create components project for ios if target is ios and apptype is Components', () => {
      mockedFs.existsSync.mockReturnValue(true);
      consts.luminFiles = ['lumin'];

      // remove packages not specified by target
      jest.spyOn(mockedFs, 'rmdirSync').mockImplementationOnce(path => {
        expect(path.endsWith('android')).toBeTruthy();
      }).mockImplementationOnce(path => {
        expect(path.endsWith('lumin')).toBeTruthy();
      });
      mockCopyComponentsFiles();
      // rename react package json
      jest.spyOn(mockedFs, 'renameSync').mockImplementationOnce((firstFilename, secondFilename) => {
        expect(firstFilename.endsWith('package.reactnative.json')).toBeTruthy();
        expect(secondFilename.endsWith('package.json')).toBeTruthy();
      });
      // remove lumin files
      jest.spyOn(mockedFs, 'unlinkSync').mockImplementationOnce((file) => {
        expect(file.endsWith('lumin')).toBeTruthy();
      });
      mockRemovePackageJsons();
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Components',
        FOLDERNAME: 'ComponentsiOS',
        APPID: 'com.test.0',
        TARGET: ['ios']
      });
      init({ '_': ['init'] });
    });
    test('create components project for ios and android if target is ios and android and apptype is Components', () => {
      mockedFs.existsSync.mockReturnValue(true);
      consts.luminFiles = ['lumin'];
      util.createAndroidLocalProperties = jest.fn('path');

      // remove packages not specified by target
      jest.spyOn(mockedFs, 'rmdirSync').mockImplementationOnce(path => {
        expect(path.endsWith('lumin')).toBeTruthy();
      });
      mockCopyComponentsFiles();
      // rename react package json
      jest.spyOn(mockedFs, 'renameSync').mockImplementationOnce((firstFilename, secondFilename) => {
        expect(firstFilename.endsWith('package.reactnative.json')).toBeTruthy();
        expect(secondFilename.endsWith('package.json')).toBeTruthy();
      });
      // create android local.properties file
      const localPropertiesSpy = jest.spyOn(util, 'createAndroidLocalProperties').mockImplementationOnce(path => {
        expect(localPropertiesSpy).toHaveBeenCalled();
      });
      // remove lumin files
      jest.spyOn(mockedFs, 'unlinkSync').mockImplementationOnce((file) => {
        expect(file.endsWith('lumin')).toBeTruthy();
      });
      mockRemovePackageJsons();
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Components',
        FOLDERNAME: 'ComponentsiOSAndroid',
        APPID: 'com.test.0',
        TARGET: ['ios', 'android']
      });
      init({ '_': ['init'] });
    });
    test('create components project for ios and lumin if target is ios and lumin and apptype is Components', () => {
      mockedFs.existsSync.mockReturnValue(true);

      // remove packages not specified by target
      jest.spyOn(mockedFs, 'rmdirSync').mockImplementationOnce(path => {
        expect(path.endsWith('android')).toBeTruthy();
      });
      mockCopyComponentsFiles();
      // rename allplatforms package json
      jest.spyOn(mockedFs, 'renameSync').mockImplementationOnce((firstFilename, secondFilename) => {
        expect(firstFilename.endsWith('package.allplatforms.json')).toBeTruthy();
        expect(secondFilename.endsWith('package.json')).toBeTruthy();
      });
      mockRemovePackageJsons();
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Components',
        FOLDERNAME: 'ComponentsiOSLumin',
        APPID: 'com.test.0',
        TARGET: ['ios', 'lumin']
      });
      init({ '_': ['init'] });
    });
    test('create components project for android and lumin if target is android and lumin and apptype is Components', () => {
      mockedFs.existsSync.mockReturnValue(true);
      util.createAndroidLocalProperties = jest.fn('path');

      // remove packages not specified by target
      jest.spyOn(mockedFs, 'rmdirSync').mockImplementationOnce(path => {
        expect(path.endsWith('ios')).toBeTruthy();
      });
      mockCopyComponentsFiles();
      // rename allplatforms package json
      jest.spyOn(mockedFs, 'renameSync').mockImplementationOnce((firstFilename, secondFilename) => {
        expect(firstFilename.endsWith('package.allplatforms.json')).toBeTruthy();
        expect(secondFilename.endsWith('package.json')).toBeTruthy();
      });
      // create android local.properties file
      const localPropertiesSpy = jest.spyOn(util, 'createAndroidLocalProperties').mockImplementationOnce(path => {
        expect(localPropertiesSpy).toHaveBeenCalled();
      });
      mockRemovePackageJsons();
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Components',
        FOLDERNAME: 'ComponentsLuminAndroid',
        APPID: 'com.test.0',
        TARGET: ['android', 'lumin']
      });
      init({ '_': ['init'] });
    });
    test('create components project for android, ios and lumin if target is android, ios and lumin and apptype is Components', () => {
      mockedFs.existsSync.mockReturnValue(true);
      util.createAndroidLocalProperties = jest.fn('path');

      mockCopyComponentsFiles();
      // rename allplatforms package json
      jest.spyOn(mockedFs, 'renameSync').mockImplementationOnce((firstFilename, secondFilename) => {
        expect(firstFilename.endsWith('package.allplatforms.json')).toBeTruthy();
        expect(secondFilename.endsWith('package.json')).toBeTruthy();
      });
      // create android local.properties file
      const localPropertiesSpy = jest.spyOn(util, 'createAndroidLocalProperties').mockImplementationOnce(path => {
        expect(localPropertiesSpy).toHaveBeenCalled();
      });
      mockRemovePackageJsons();
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Components',
        FOLDERNAME: 'ComponentsLuminAndroidiOS',
        APPID: 'com.test.0',
        TARGET: ['android', 'lumin', 'ios']
      });
      init({ '_': ['init'] });
    });
  });

  describe('Test Landscape and Immersive configurations', () => {
    test('project exists not immersive no manifest', () => {
      mockedFs.existsSync.mockReturnValueOnce(true);
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
        expect(type).toBe('utf8');
        expect(contents).toBe('test1');
        expect(path.endsWith('file1')).toBeTruthy();
      }).mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test2');
        expect(path.endsWith('file2')).toBeTruthy();
      });
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Landscape'
      });
      init({ '_': ['init'] });
    });
  
    test('project exists immersive no manifest', () => {
      mockedFs.existsSync.mockReturnValueOnce(true);
      jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
        return ['file1', 'app.js'];
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
        expect(type).toBe('utf8');
        expect(contents).toBe('test1');
        expect(path.endsWith('file1')).toBeTruthy();
      }).mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test2');
        expect(path.endsWith('app.js')).toBeTruthy();
      });
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Immersive',
        FOLDERNAME: 'Test2',
        APPID: 'com.test.suite2'
      });
      init({ '_': ['init'] });
    });
  
    test('project exists not immersive', () => {
      mockedFs.existsSync.mockReturnValueOnce(true);
      jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
        return ['manifest.xml', 'file2'];
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
        expect(type).toBe('utf8');
        expect(contents).toBe('test1');
        expect(path.endsWith('manifest.xml')).toBeTruthy();
      }).mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test2');
        expect(path.endsWith('file2')).toBeTruthy();
      });
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Landscape',
        FOLDERNAME: 'Test3',
        APPID: 'com.test.suite3'
      });
      init({ '_': ['init'] });
    });
  
    test('project exists immersive', () => {
      mockedFs.existsSync.mockReturnValueOnce(true);
      jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
        return ['manifest.xml', 'file2'];
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
        expect(type).toBe('utf8');
        expect(contents).toBe('test1');
        expect(path.endsWith('manifest.xml')).toBeTruthy();
      }).mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test2');
        expect(path.endsWith('file2')).toBeTruthy();
      });
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Immersive',
        FOLDERNAME: 'Test4',
        APPID: 'com.test.suite4'
      });
      init({ '_': ['init'] });
    });
  
    test('no project exists', () => {
      mockedFs.existsSync.mockReturnValueOnce(false);
      jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
        expect(mockedFs.mkdirSync).toHaveBeenCalled();
        return ['manifest.xml', 'file2'];
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
        expect(type).toBe('utf8');
        expect(contents).toBe('test1');
        expect(path.endsWith('manifest.xml')).toBeTruthy();
      }).mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test2');
        expect(path.endsWith('file2')).toBeTruthy();
      });
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Landscape',
        FOLDERNAME: 'Test5',
        APPID: 'com.test.suite5'
      });
      init({ '_': ['init'] });
    });
  
    test('bad project name', () => {
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Immersive',
        FOLDERNAME: '$A',
        APPID: 'com.test.suite'
      });
      init({ '_': ['init'] });
      expect(mockedFs.existsSync).not.toHaveBeenCalled();
    });
  
    test('bad package name', () => {
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Immersive',
        FOLDERNAME: 'Test6',
        APPID: '$A'
      });
      init({ '_': ['init'] });
      expect(mockedFs.existsSync).not.toHaveBeenCalled();
    });
  
    test('no project exists with subdir', () => {
      mockedFs.existsSync.mockReturnValue(false);
      jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
        expect(mockedFs.mkdirSync).toHaveBeenCalled();
        return ['manifest.xml', 'folder'];
      }).mockImplementationOnce((path) => {
        return ['file1'];
      });
      jest.spyOn(mockedFs, 'statSync').mockImplementation((path) => {
        var statObject = {};
        statObject.isFile = function () {
          if (path.endsWith('folder')) {
            return false;
          } else {
            return true;
          }
        };
        statObject.isDirectory = function () { return true; };
        return statObject;
      });
      mockedFs.readFileSync.mockImplementationOnce(() => {
        return 'test1';
      }).mockImplementationOnce(() => {
        return 'test2';
      });
      jest.spyOn(mockedFs, 'writeFileSync').mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test1');
        expect(path.endsWith('manifest.xml')).toBeTruthy();
      }).mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test2');
        expect(path.endsWith('file1')).toBeTruthy();
      });
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Landscape',
        FOLDERNAME: 'Test7',
        APPID: 'com.test.suite7'
      });
      init({ '_': ['init'] });
    });
  
    test('visibleName parameter', () => {
      mockedFs.existsSync.mockReturnValue(false);
      jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
        expect(mockedFs.mkdirSync).toHaveBeenCalled();
        return ['manifest.xml', 'folder'];
      }).mockImplementationOnce((path) => {
        return ['file1'];
      });
      jest.spyOn(mockedFs, 'statSync').mockImplementation((path) => {
        var statObject = {};
        statObject.isFile = function () {
          if (path.endsWith('folder')) {
            return false;
          } else {
            return true;
          }
        };
        statObject.isDirectory = function () { return true; };
        return statObject;
      });
      mockedFs.readFileSync.mockImplementationOnce(() => {
        return 'test1';
      }).mockImplementationOnce(() => {
        return 'test2';
      });
      jest.spyOn(mockedFs, 'writeFileSync').mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test1');
        expect(path.endsWith('manifest.xml')).toBeTruthy();
      }).mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test2');
        expect(path.endsWith('file1')).toBeTruthy();
      });
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Landscape',
        FOLDERNAME: 'Test8',
        APPID: 'com.test.suite8'
      });
      init({ '_': ['init'], visibleName: 'visible' });
    });
  
    test('visibleName folderName parameter', () => {
      mockedFs.existsSync.mockReturnValue(false);
      jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
        expect(mockedFs.mkdirSync).toHaveBeenCalled();
        return ['manifest.xml', 'folder'];
      }).mockImplementationOnce((path) => {
        return ['file1'];
      });
      jest.spyOn(mockedFs, 'statSync').mockImplementation((path) => {
        var statObject = {};
        statObject.isFile = function () {
          if (path.endsWith('folder')) {
            return false;
          } else {
            return true;
          }
        };
        statObject.isDirectory = function () { return true; };
        return statObject;
      });
      mockedFs.readFileSync.mockImplementationOnce(() => {
        return 'test1';
      }).mockImplementationOnce(() => {
        return 'test2';
      });
      jest.spyOn(mockedFs, 'writeFileSync').mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test1');
        expect(path.endsWith('manifest.xml')).toBeTruthy();
      }).mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test2');
        expect(path.endsWith('file1')).toBeTruthy();
      });
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Landscape',
        APPID: 'com.test.suite9'
      });
      init({ '_': ['init'], visibleName: 'visible', folderName: 'project' });
    });
    
    test('packageName folderName parameter', () => {
      mockedFs.existsSync.mockReturnValue(false);
      jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
        expect(mockedFs.mkdirSync).toHaveBeenCalled();
        return ['manifest.xml', 'folder'];
      }).mockImplementationOnce((path) => {
        return ['file1'];
      });
      jest.spyOn(mockedFs, 'statSync').mockImplementation((path) => {
        var statObject = {};
        statObject.isFile = function () {
          if (path.endsWith('folder')) {
            return false;
          } else {
            return true;
          }
        };
        statObject.isDirectory = function () { return true; };
        return statObject;
      });
      mockedFs.readFileSync.mockImplementationOnce(() => {
        return 'test1';
      }).mockImplementationOnce(() => {
        return 'test2';
      });
      jest.spyOn(mockedFs, 'writeFileSync').mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test1');
        expect(path.endsWith('manifest.xml')).toBeTruthy();
      }).mockImplementationOnce((path, contents, type) => {
        expect(type).toBe('utf8');
        expect(contents).toBe('test2');
        expect(path.endsWith('file1')).toBeTruthy();
      });
      backup = inquirer.prompt;
      inquirer.prompt = () => Promise.resolve({
        APPTYPE: 'Landscape'
      });
      init({ '_': ['init'], packageName: 'packageID', folderName: 'project' });
    });
  });
});
