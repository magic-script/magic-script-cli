// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
// eslint-disable-next-line camelcase
jest.mock('fs');
const mockedFs = require('fs');
const child_process = require('child_process');
jest.spyOn(child_process, 'exec');
jest.spyOn(child_process, 'spawn');
const util = require('../lib/util');
const install = require('../commands/install');
beforeEach(() => {
  util.navigateIfComponents = jest.fn().mockReturnValueOnce(true);
  util.findMPKPath = jest.fn().mockReturnValueOnce('testPath');
  jest.spyOn(util, 'isInstalled');
  jest.spyOn(util, 'findPackageName').mockReturnValueOnce('com.abc');
});

afterEach(() => {
  if (util.isInstalled.mock) {
    util.isInstalled.mockRestore();
  }
  if (child_process.exec.mock) {
    child_process.exec.mockReset();
  }
  if (child_process.spawn.mock) {
    child_process.spawn.mockReset();
  }
  util.findPackageName.mockReset();
  if (mockedFs.existsSync.mock) {
    mockedFs.existsSync.mockReset();
  }
});

describe('Test install', () => {
  test('clean install', () => {
    util.isInstalled.mockImplementationOnce((pakage, callback) => {
      callback(false);
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb install  my/path.mpk');
      callback(null, 'install success');
    });

    child_process.spawn.mockImplementationOnce(() => {
      let stdout = function (data, callback) {
      };
      let stderr = function (data, callback) {
      };
      return { 'stderr': { 'on': stderr }, 'stdout': { 'on': stdout }, 'on': stderr };
    });
    jest.spyOn(mockedFs, 'existsSync').mockReturnValueOnce(true);
    install({ '_': ['install'], path: 'my/path.mpk', 'target': 'lumin' });
  });

  test('install error', () => {
    util.isInstalled.mockImplementationOnce((pakage, callback) => {
      callback(false);
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb install  my/path.mpk');
      try {
        callback('error', 'install failed', '');
        expect(false).toBe(true);
      } catch (err) {
        expect(err).toBe('error');
      }
    });
    jest.spyOn(mockedFs, 'existsSync').mockReturnValueOnce(true);
    install({ '_': ['install'], path: 'my/path.mpk', 'target': 'lumin' });
  });

  test('re-install', () => {
    util.isInstalled.mockImplementationOnce((pakage, callback) => {
      callback(true);
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb install -u my/path.mpk');
      callback(null, 'install success');
    });
    jest.spyOn(mockedFs, 'existsSync').mockReturnValueOnce(true);
    install({ '_': ['install'], path: 'my/path.mpk', 'target': 'lumin' });
  });

  test('install missing MPK file', () => {
    jest.spyOn(mockedFs, 'existsSync').mockReturnValueOnce(false);
    install({ '_': ['install'], path: 'my/path.mpk', 'target': 'lumin' });
  });
});
