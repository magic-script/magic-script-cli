// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
jest.mock('fs');
jest.mock('glob');

const mockedFs = require('fs');
jest.spyOn(mockedFs, 'existsSync');
jest.spyOn(mockedFs, 'readFileSync');
const child_process = require('child_process');
jest.spyOn(child_process, 'exec');
jest.spyOn(child_process, 'execFile');
jest.spyOn(child_process, 'execSync');
const util = require('../lib/util');

const consoleLog = console.log;
const consoleError = console.error;

beforeEach(() => {
  mockedFs.existsSync = jest.fn();
});

afterEach(() => {
  console.log = consoleLog;
  console.error = consoleError;
});

describe('Test Util', () => {
  test('isInstalled error', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      return "success";
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('error getting installed packages:');
    });
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe('mldb packages -j');
      cb('error');
    });
    util.isInstalled('com.abc', function (result) {
      expect(result).toBeFalsy();
    });
  });

  test('isInstalled no match', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      return "success";
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
      return "success";
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
      return "success";
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

  test('startMLDB no error', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      return "success";
    });
    expect(util.startMLDB()).toBe(true);
  });

  test('startMLDB error', () => {
    child_process.execSync.mockImplementationOnce((input) => {
      expect(input).toBe('mldb start-server');
      throw new Error("oops");
    });
    expect(util.startMLDB()).toBe(false);
  });
});
