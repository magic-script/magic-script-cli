// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
jest.mock('fs');

const inquirer = require('inquirer');
const mockedFs = require('fs');
jest.spyOn(mockedFs, 'existsSync');
jest.spyOn(mockedFs, 'readFileSync');
const init = require('../commands/init');

beforeEach(() => {
  mockedFs.existsSync = jest.fn();
});

describe('Test Init', () => {
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
    let backup = inquirer.prompt;
    inquirer.prompt = () => Promise.resolve({ APPTYPE: true });
    init({ '_': ['init'] });
    inquirer.prompt = backup;
  });

  test('project exists immersive no manifest', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    jest.spyOn(mockedFs, 'readdirSync').mockImplementationOnce((path) => {
      return ['file1', 'main.js'];
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
      expect(path.endsWith('main.js')).toBeTruthy();
    });
    let backup = inquirer.prompt;
    inquirer.prompt = () => Promise.resolve({ APPTYPE: false });
    init({ '_': ['init'] });
    inquirer.prompt = backup;
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
    let backup = inquirer.prompt;
    inquirer.prompt = () => Promise.resolve({ APPTYPE: true });
    init({ '_': ['init'] });
    inquirer.prompt = backup;
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
    let backup = inquirer.prompt;
    inquirer.prompt = () => Promise.resolve({ APPTYPE: false });
    init({ '_': ['init'] });
    inquirer.prompt = backup;
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
    let backup = inquirer.prompt;
    inquirer.prompt = () => Promise.resolve({ APPTYPE: true });
    init({ '_': ['init'] });
    inquirer.prompt = backup;
  });

  test('bad project name', () => {
    let backup = inquirer.prompt;
    inquirer.prompt = () => Promise.resolve({ APPTYPE: true, FOLDERNAME: '$A' });
    init({ '_': ['init'] });
    inquirer.prompt = backup;
    expect(mockedFs.existsSync).not.toHaveBeenCalled();
  });

  test('bad package name', () => {
    let backup = inquirer.prompt;
    inquirer.prompt = () => Promise.resolve({ APPTYPE: true, APPID: '$A' });
    init({ '_': ['init'] });
    inquirer.prompt = backup;
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
    let backup = inquirer.prompt;
    inquirer.prompt = () => Promise.resolve({ APPTYPE: true });
    init({ '_': ['init'] });
    inquirer.prompt = backup;
  });
});
