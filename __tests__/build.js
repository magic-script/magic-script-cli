// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under MIT License. See LICENSE file in the project root for full license information.
jest.mock('fs');
jest.mock('glob');

const mockedFs = require('fs');
jest.spyOn(mockedFs, 'existsSync');
jest.spyOn(mockedFs, 'readFileSync');
jest.spyOn(mockedFs, 'readdirSync');
const child_process = require('child_process');
jest.spyOn(child_process, 'exec');
const util = require('../lib/util');
const build = require('../commands/build');

beforeEach(() => {
  mockedFs.existsSync = jest.fn();
  mockedFs.mkdirSync = jest.fn();
  mockedFs.readdirSync = jest.fn();
});

afterEach(() => {
  if (util.isInstalled.mock) {
    util.isInstalled.mockRestore();
  }
  if (child_process.exec.mock) {
    child_process.exec.mockReset();
  }
});

describe('Test build', () => {
  test('error npm run', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      expect(() => callback('error')).toThrow();
    });
    build({ '_': ['build'], 'install': false });
  });

  test('error mabu', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t device app.package');
        expect(() => callback('error')).toThrow();
      });
      callback(null);
    });
    build({ '_': ['build'], 'install': false });
  });

  test('no error no install', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t device app.package');
        callback(null, 'out.mpk');
      });
      callback(null);
    });
    build({ '_': ['build'], 'install': false });
  });

  test('no error mldb install', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t device app.package');
        jest.spyOn(util, 'findPackageName').mockReturnValueOnce('com.abc');
        util.isInstalled = jest.fn().mockImplementationOnce((packageName, callback) => {
          expect(packageName).toBe('com.abc');
          callback(false);
        });
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb install  ');
          callback(null);
        });
        callback(null, 'out.mpk');
      });
      callback(null);
    });
    build({ '_': ['build'], 'install': true });
  });

  test('error mldb install', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t device app.package');
        jest.spyOn(util, 'findPackageName').mockReturnValueOnce('com.abc');
        util.isInstalled = jest.fn().mockImplementationOnce((packageName, callback) => {
          expect(packageName).toBe('com.abc');
          callback(false);
        });
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb install  ');
          expect(() => callback('error')).toThrow();
        });
        callback(null, 'out.mpk');
      });
      callback(null);
    });
    build({ '_': ['build'], 'install': true });
  });

  test('error npm install', () => {
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm install');
      expect(() => callback('error')).toThrow();
    });
    build({ '_': ['build'], 'install': true });
  });

  test('no error npm install', () => {
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm install');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('npm run build');
      });
      callback(null);
    });
    build({ '_': ['build'], 'install': true });
  });

  test('readdir no package', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['test.mabu'];
    });
    util.createDigest = jest.fn().mockReturnValueOnce(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t device app.package');
      });
      callback(null);
    });
    build({ '_': ['build'], 'install': false });
  });

  test('mkdir error EEXIST', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    mockedFs.mkdirSync.mockImplementationOnce(() => {
      let err = Error('EEXIST');
      err.code = 'EEXIST';
      throw err;
    });
    util.createDigest = jest.fn().mockReturnValueOnce(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t device app.package');
      });
      callback(null);
    });
    build({ '_': ['build'], 'install': false });
  });

  test('mkdir error other', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    mockedFs.mkdirSync.mockImplementationOnce(() => {
      let err = Error('other');
      err.code = 'other';
      throw err;
    });
    util.createDigest = jest.fn().mockReturnValueOnce(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
    });
    expect(() => build({ '_': ['build'], 'install': false })).toThrow();
  });

  test('readdir error', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      throw new Error();
    });
    util.createDigest = jest.fn().mockReturnValueOnce(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
    });
    expect(() => build({ '_': ['build'], 'install': false })).toThrow();
  });
});
