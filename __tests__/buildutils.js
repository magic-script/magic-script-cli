// Copyright (c) 2020 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
jest.mock('fs');
jest.mock('../lib/util');
jest.mock('../lib/logger');
jest.mock('child_process');

const child_process = require('child_process');
const events = require('events');

jest.spyOn(child_process, 'spawnSync');
jest.spyOn(child_process, 'execSync');
jest.spyOn(child_process, 'spawn');

const mockedFs = require('fs');
const util = require('../lib/util');
const buildUtils = require('../lib/buildutils');
const logger = require('../lib/logger');

const nextTick = () => new Promise((res) => process.nextTick(res));

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
  if (process.chdir.mock) {
    process.chdir.mockRestore();
  }
});
describe('Test build utils methods', () => {
  test('should return false if target is not either lumin, ios or android', () => {
    let argv = {
      target: 'unknown'
    };
    expect(buildUtils.isTargetSpecified(argv)).toBeFalsy();
    expect(buildUtils.isTargetSpecified({})).toBeFalsy();
    expect(buildUtils.isTargetSpecified(null)).toBeFalsy();
  });

  test('should return true if target is lumin, ios or android', () => {
    expect(buildUtils.isTargetSpecified({ target: 'lumin' })).toBeTruthy();
    expect(buildUtils.isTargetSpecified({ target: 'android' })).toBeTruthy();
    expect(buildUtils.isTargetSpecified({ target: 'ios' })).toBeTruthy();
  });

  test('should not install node modules if they already exist', async () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    const callback = jest.fn();

    buildUtils.npmInstallIfNeeded('path', callback);
    await nextTick();

    expect(mockedFs.existsSync).toHaveBeenCalledWith('path/node_modules');
    expect(callback).toHaveBeenCalled();
  });

  test('should install node modules if they not exist', async () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    const callback = jest.fn();
    const emitter = new events.EventEmitter();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('npm');
      expect(commandArgs).toStrictEqual(['install']);
      emitter.on('message', (message) => {});
      emitter.on('error', (err) => {
        throw err;
      });
      emitter.on('exit', (code, signal) => {});
      return emitter;
    });

    buildUtils.npmInstallIfNeeded('path', callback);
    emitter.emit('exit');
    expect(callback).toHaveBeenCalled();
    expect(logger.green).toHaveBeenCalledWith('npm install: success');
  });

  test('should throw error if signal is not undefined', async () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    const callback = jest.fn();
    const emitter = new events.EventEmitter();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('npm');
      expect(commandArgs).toStrictEqual(['install']);
      emitter.on('message', (message) => {});
      emitter.on('error', (err) => {
        throw err;
      });
      emitter.on('exit', (code, signal) => {});
      return emitter;
    });

    buildUtils.npmInstallIfNeeded('path', callback);
    expect(() => emitter.emit('exit', 'signal', 0)).toThrow();
    expect(callback).not.toHaveBeenCalled();
    expect(logger.green).not.toHaveBeenCalledWith('npm install: success');
  });

  test('should throw error if code is not 0', async () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    const callback = jest.fn();
    const emitter = new events.EventEmitter();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('npm');
      expect(commandArgs).toStrictEqual(['install']);
      emitter.on('message', (message) => {});
      emitter.on('error', (err) => {
        throw err;
      });
      emitter.on('exit', (code, signal) => {});
      return emitter;
    });

    buildUtils.npmInstallIfNeeded('path', callback);
    expect(() => emitter.emit('exit', null, 1)).toThrow();
    expect(callback).not.toHaveBeenCalled();
    expect(logger.green).not.toHaveBeenCalledWith('npm install: success');
  });

  test('emitter should throw error', async () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    const callback = jest.fn();
    const emitter = new events.EventEmitter();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('npm');
      expect(commandArgs).toStrictEqual(['install']);
      emitter.on('message', (message) => {});
      emitter.on('exit', (code, signal) => {});
      return emitter;
    });

    expect(() => {
      buildUtils.npmInstallIfNeeded('path', callback);
      emitter.emit('error', new Error('error'));
    }).toThrow('error');
    expect(callback).not.toHaveBeenCalled();
    expect(logger.green).not.toHaveBeenCalledWith('npm install: success');
  });

  test('should throw error if spawn throw error', async () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    const callback = jest.fn();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      throw new Error('Throw spawn error');
    });

    expect(() => {
      buildUtils.npmInstallIfNeeded('path', callback);
    }).toThrow('Throw spawn error');
    expect(callback).not.toHaveBeenCalled();
    expect(logger.green).not.toHaveBeenCalledWith('npm install: success');
  });

  test('should log message if message is ', async () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    const callback = jest.fn();
    const emitter = new events.EventEmitter();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('npm');
      expect(commandArgs).toStrictEqual(['install']);
      emitter.on('message', (message) => {});
      emitter.on('error', (err) => { throw err; });
      emitter.on('exit', (code, signal) => {});
      return emitter;
    });

    buildUtils.npmInstallIfNeeded('path', callback);
    emitter.emit('message', 'message');
    expect(logger.normal).toHaveBeenCalledWith('message');
  });

  test('should return true if target is either android or ios', () =>{
    let argv = { target: 'ios' };
    expect(buildUtils.isReactNativeTarget(argv)).toBeTruthy();
    argv = { target: 'android' };
    expect(buildUtils.isReactNativeTarget(argv)).toBeTruthy();
    argv = { target: 'lumin' };
    expect(buildUtils.isReactNativeTarget(argv)).toBeFalsy();
  });

  test('should install pods and run iOS build method if ios project is set properly', async () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    const emitter = new events.EventEmitter();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('pod');
      expect(commandArgs).toStrictEqual(['install']);
      emitter.on('message', (message) => {});
      emitter.on('error', (err) => {
        throw err;
      });
      emitter.on('exit', (code, signal) => {});
      return emitter;
    }).mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('npx');
      expect(commandArgs).toStrictEqual(['react-native', 'run-ios']);
      emitter.on('message', (message) => {});
      emitter.on('error', (err) => {
        throw err;
      });
      emitter.on('exit', (code, signal) => {});
      return emitter;
    });

    buildUtils.buildiOS();
    emitter.emit('exit');
  });

  test('should show message when ios project is not set', async () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    buildUtils.buildiOS();
    expect(logger.red).toHaveBeenCalledWith("Cannot build the app for iOS because the project project wasn't set up to support this platform!")
  });

  test('should run android project if it is set properly', async () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    const emitter = new events.EventEmitter();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('npx');
      expect(commandArgs).toStrictEqual(['react-native', 'run-android']);
      emitter.on('message', (message) => {});
      emitter.on('error', (err) => {
        throw err;
      });
      emitter.on('exit', (code, signal) => {});
      return emitter;
    });

    buildUtils.buildAndroid();
    emitter.emit('exit');
    expect(mockedFs.chmodSync).toHaveBeenCalled();
  });

  test('should show message when android project is not set', async () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    buildUtils.buildAndroid();
    expect(logger.red).toHaveBeenCalledWith("Cannot build the app for Android because the project wasn't set up to support this platform!")
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
        expect(() => callback('error', '', '')).toThrow();
      });
      callback(null);
    });
    buildUtils.buildLumin({}, 'path');
  });

  test('error npm run build', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      expect(() => callback('error', '', '')).toThrow();
    });
    buildUtils.buildLumin({}, 'path');
  });

  test('mabu uses release_device when not debuggable', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t release_device app.package');
        callback(null, 'out.mpk');
      });
      callback(null);
    });
    buildUtils.buildLumin({ 'debug': false }, 'path');
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
    buildUtils.buildLumin({ 'install': false }, 'path');
  });

  test('no error build for host', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t host app.package');
        callback(null, "'app' output in '.out/app'");
      });
      callback(null);
    });
    buildUtils.buildLumin({ 'host': true }, 'path');
  });

  test('build for host valid buffer missing USES', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    mockedFs.readFileSync = jest.fn().mockReturnValue('test');
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t host app.package');
        callback(null, "'app' output in '.out/app'");
      });
      callback(null);
    });
    buildUtils.buildLumin({ 'host': true }, 'path');
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
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe('mldb install  ');
          callback(null, 'install success');
        });
        util.isInstalled = jest.fn().mockImplementationOnce((packageName, callback) => {
          expect(packageName).toBe('com.abc');
          callback(false);
        });
        callback(null, 'out.mpk');
      });
      callback(null);
    });
    buildUtils.buildLumin({ 'install': true, path: 'my/path.mpk' }, 'content');
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
        callback(null, 'out.mpk');
      });
      callback(null);
    });
    buildUtils.buildLumin({}, 'content');
  });

  test('should navigate to lumin directory to build components project', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    process.chdir = jest.fn();
    buildUtils.navigateToLuminDirectory();
    expect(mockedFs.existsSync).toHaveBeenCalled();
    expect(process.chdir).toHaveBeenCalledWith('lumin/');
  });

  test('should check multiplatform structure', () => {
    process.cwd = jest.fn().mockReturnValueOnce('path');
    buildUtils.isMultiplatformStructure();
    expect(mockedFs.existsSync).toHaveBeenCalledWith('path/lumin/rollup.config.js');
  });

  test('readdir no package', () => {
    mockedFs.existsSync.mockReturnValue(true);
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
    buildUtils.buildLumin({ 'install': false }, 'path');
  });

  test('mkdir error EEXIST', () => {
    mockedFs.existsSync.mockReturnValue(true);
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
    buildUtils.buildLumin({ 'install': false }, 'path');
  });

  test('mkdir error other', () => {
    mockedFs.existsSync.mockReturnValue(true);
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
    expect(() => buildUtils.buildLumin({ 'install': false }, 'path')).toThrow();
  });

  test('readdir error', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      throw new Error();
    });
    util.createDigest = jest.fn().mockReturnValueOnce(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
    });
    expect(() => buildUtils.buildLumin({ 'install': false }, 'path')).toThrow();
  });
});
