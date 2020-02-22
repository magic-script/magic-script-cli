// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const path = require('path');
// eslint-disable-next-line camelcase
const child_process = require('child_process');
jest.spyOn(child_process, 'exec');
jest.spyOn(child_process, 'spawn');
const util = require('../lib/util');
const run = require('../commands/run');

const consoleInfo = console.info;
const consoleError = console.error;
const consoleWarn = console.warn;
jest.useFakeTimers();

afterEach(() => {
  console.info = consoleInfo;
  console.error = consoleError;
  console.warn = consoleWarn;
});

describe('Test Run', () => {
  test('not installed "com.abc"', () => {
    jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(false);
    });
    jest.spyOn(console, 'warn').mockImplementationOnce((data) => {
      expect(data).toBe('Package: com.abc is not installed.  Please install it.');
    });
    run({ '_': ['run', 'com.abc'], target: 'lumin' });
  });

  test('not installed "com.abc" running', () => {
    jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(false);
    });
    jest.spyOn(console, 'warn').mockImplementationOnce((data) => {
      expect(data).toBe('Package: com.abc is not installed.  Please install it.');
    });
    run({ '_': ['run', 'com.abc'], target: 'lumin' });
  });

  test('no packageName', () => {
    const mockFindPackageName = jest.spyOn(util, 'findPackageName').mockReturnValueOnce('');
    run({ '_': ['run'], target: 'lumin' });
    expect(mockFindPackageName).toHaveBeenCalled();
  });

  test('Installed "com.abc"', () => {
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe('mldb ps');
    });
    run({ '_': ['run', 'com.abc'], target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running', () => {
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Terminating:');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb terminate com.abc');
      });
      callback(null, '1440 110011 Running com.abc .universe');
    });
    run({ '_': ['run', 'com.abc'], target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running error', () => {
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Launching: com.abc at port: 56965');
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('exec error: error');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb launch -v INSPECTOR_PORT=56965 com.abc');
      });
      callback('error');
    });
    run({ '_': ['run', 'com.abc'], target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running error launch', () => {
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Launching: com.abc at port: 56965');
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('exec error: error');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb launch -v INSPECTOR_PORT=56965 com.abc');
        callback('error');
      });
      callback('error');
    });
    run({ '_': ['run', 'com.abc'], target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running launch log error', () => {
    child_process.spawn.mockImplementationOnce(() => {
      let stdout = function (data, callback) {
        expect(data).toBe('data');
      };
      let stderr = function (data, callback) {
        expect(data).toBe('data');
        callback('error');
      };
      return { 'stderr': { 'on': stderr }, 'stdout': { 'on': stdout } };
    });
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Launching: com.abc at port: 56965');
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('exec error: error');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb launch --auto-net-privs -v INSPECTOR_PORT=56965 com.abc');
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb ps');
          callback(null, '1440 110011 Running com.abc .universe');
        });
        callback(null, 'Success');
      });
      callback('error');
    });
    run({ '_': ['run', 'com.abc'], 'debug': true, target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running launch log', () => {
    child_process.spawn.mockImplementationOnce(() => {
      let stdout = function (data, callback) {
        expect(data).toBe('data');
        callback('1440 chrome://asdf:12345');
      };
      let stderr = function (data, callback) {
        expect(data).toBe('data');
      };
      let kill = function () { };
      return { 'stderr': { 'on': stderr }, 'stdout': { 'on': stdout }, 'kill': kill };
    });
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Launching: com.abc at port: 56965');
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('exec error: error');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb launch --auto-net-privs -v INSPECTOR_PORT=56965 com.abc');
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb ps');
          callback(null, '1440 110011 Running com.abc .universe');
        });
        callback(null, 'Success');
      });
      callback('error');
    });
    run({ '_': ['run', 'com.abc'], 'debug': true, target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running launch log exec error', () => {
    child_process.spawn.mockImplementationOnce(() => {
      let stdout = function (data, callback) {
        expect(data).toBe('data');
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb forward tcp:12345 tcp:12345');
          callback('error');
        });
        callback('1440 chrome://asdf:12345');
      };
      let stderr = function (data, callback) {
        expect(data).toBe('data');
      };
      let kill = function () { };
      return { 'stderr': { 'on': stderr }, 'stdout': { 'on': stdout }, 'kill': kill };
    });
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Launching: com.abc at port: 56965');
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('exec error: error');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb launch --auto-net-privs -v INSPECTOR_PORT=56965 com.abc');
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb ps');
          callback(null, '1440 110011 Running com.abc .universe');
        });
        callback(null, 'Success');
      });
      callback('error');
    });
    run({ '_': ['run', 'com.abc'], 'debug': true, target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running launch log exec success', () => {
    child_process.spawn.mockImplementationOnce(() => {
      let stdout = function (data, callback) {
        expect(data).toBe('data');
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb forward tcp:12345 tcp:12345');
          callback(null, '', '');
        });
        callback('1440 chrome://asdf:12345');
      };
      let stderr = function (data, callback) {
        expect(data).toBe('data');
      };
      let kill = function () { };
      return { 'stderr': { 'on': stderr }, 'stdout': { 'on': stdout }, 'kill': kill };
    });
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Launching: com.abc at port: 56965');
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('exec error: error');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb launch --auto-net-privs -v INSPECTOR_PORT=56965 com.abc');
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb ps');
          callback(null, '1440 110011 Running com.abc .universe');
        });
        callback(null, 'Success');
      });
      callback('error');
    });
    run({ '_': ['run', 'com.abc'], 'debug': true, target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running launch log exec success no debug', () => {
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Launching: com.abc at port: 56965');
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('exec error: error');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb launch -v INSPECTOR_PORT=56965 com.abc');
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb ps');
          callback(null, '1440 110011 Running com.abc .universe');
        });
        callback(null, 'Success');
      });
      callback('error');
    });
    run({ '_': ['run', 'com.abc'], 'debug': false, target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running launch with port specified success no debug', () => {
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Launching: com.abc at port: 12345');
    });
    jest.spyOn(console, 'error').mockImplementationOnce((data) => {
      expect(data).toBe('exec error: error');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb launch -v INSPECTOR_PORT=12345 com.abc');
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb ps');
          callback(null, '1440 110011 Running com.abc .universe');
        });
        callback(null, 'Success');
      });
      callback('error');
    });
    run({ '_': ['run', 'com.abc'], 'debug': false, 'port': 12345, target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('Installed "com.abc" running terminated', () => {
    const mockIsInstalled = jest.spyOn(util, 'isInstalled').mockImplementationOnce((packageName, callback) => {
      expect(packageName === 'com.abc').toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, 'info').mockImplementationOnce((data) => {
      expect(data).toBe('Terminating:');
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('mldb ps');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mldb terminate com.abc');
        callback();
        expect(setTimeout).toHaveBeenCalled();
        jest.runAllTimers();
      });
      callback(null, '1440 110011 Running com.abc .universe');
    });
    run({ '_': ['run', 'com.abc'], target: 'lumin' });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test('run on host', () => {
    child_process.spawn.mockImplementationOnce((command, params) => {
      let stdout = function (data, callback) {
        expect(data).toBe('data');
        callback('1440 chrome://asdf:12345');
      };
      let stderr = function (data, callback) {
        expect(data).toBe('data');
        callback('1440 chrome://asdf:12345');
      };
      expect(command).toBe('mxs');
      expect(params.length).toBe(1);
      expect(params[0]).toBe('bin/index.js');
      return { 'stderr': { 'on': stderr }, 'stdout': { 'on': stdout } };
    });
    jest.spyOn(util, 'findMPKPath').mockReturnValueOnce('myPath');
    process.chdir = jest.fn();
    jest.spyOn(path, 'join');
    run({ '_': ['run', 'com.abc'], 'host': true, target: 'lumin' });
    expect(child_process.spawn).toHaveBeenCalled();
    expect(path.join).toHaveBeenCalledWith('bin', 'index.js');
  });
});
