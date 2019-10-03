// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
jest.mock('fs');
jest.mock('glob');

const mockedFs = require('fs');
const events = require('events');

jest.spyOn(mockedFs, 'existsSync');
jest.spyOn(mockedFs, 'readFileSync');
jest.spyOn(mockedFs, 'readdirSync');
// eslint-disable-next-line camelcase
const child_process = require('child_process');
jest.spyOn(child_process, 'exec');
jest.spyOn(child_process, 'spawn');
const util = require('../lib/util');
const build = require('../commands/build');

beforeEach(() => {
  mockedFs.existsSync = jest.fn();
  mockedFs.mkdirSync = jest.fn();
  mockedFs.readdirSync = jest.fn();
  util.copyComponentsFiles = jest.fn();
  process.chdir = jest.fn();
});

afterEach(() => {
  if (util.isInstalled.mock) {
    util.isInstalled.mockRestore();
  }
  if (util.copyComponentsFiles.mock) {
    util.copyComponentsFiles.mockRestore();
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

describe('Test build', () => {
  test('error npm run', () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      expect(() => callback ('error', '', '')).toThrow();
    });
    build({ '_': ['build'], 'install': false, 'target': 'lumin' });
  });

  test('should spawn npm install if node_modules does not exist and call callback when spawn ends', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    const emitter = new events.EventEmitter();
    const callback = jest.fn();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('npm');
      expect(commandArgs).toStrictEqual(['install']);
      emitter.on('message', () => {});
      emitter.on('error', (err) => { throw err; });
      emitter.on('exit', () => {
        expect(callback).toHaveBeenCalled();
      });
      return emitter;
    });
    build({ '_': ['build'], install: false, 'target': 'android' });
    emitter.emit('exit');
  });

  test('should throw error on npm install if error occurs', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    const emitter = new events.EventEmitter();
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('npm');
      expect(commandArgs).toStrictEqual(['install']);
      emitter.on('message', () => {});
      emitter.on('error', () => { expect(emitter).toThrow(); });
      emitter.on('exit', () => {
      });
      return emitter;
    });
    expect(() => {
      build({ '_': ['build'], install: false, 'target': 'android' });
      emitter.emit('error');
    }).toThrow();
  });

  test('should not build any platform if target is not specified', () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    build({ '_': ['build'], 'install': false });
    expect(mockedFs.existsSync).not.toHaveBeenCalled();
  });

  test('should build android project if target is android', () => {
    mockedFs.existsSync.mockReturnValue(true);
    const runEmitter = new events.EventEmitter();
    jest.spyOn(mockedFs, 'chmodSync').mockImplementationOnce((path, chmod) => {
      expect(path.endsWith('android/gradlew')).toBeTruthy();
      expect(chmod).toBe('755');
    });
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('react-native');
      expect(commandArgs).toStrictEqual(['run-android']);
      runEmitter.on('message', () => {});
      runEmitter.on('error', (err) => { throw err; });
      runEmitter.on('exit', () => {});
      return runEmitter;
    });
    build({ '_': ['build'], 'install': false, 'target': 'android' });
  });

  test('should install pods, build and run ios when target is ios', () => {
    mockedFs.existsSync.mockReturnValue(true);
    const podInstallEmitter = new events.EventEmitter();
    const runEmitter = new events.EventEmitter();
    const podsInstallCallback = () => {
      child_process.spawn.mockImplementationOnce((command, commandArgs) => {
        expect(command).toBe('react-native');
        expect(commandArgs).toStrictEqual(['run-ios']);
        runEmitter.on('message', () => {});
        runEmitter.on('error', (err) => { throw err; });
        runEmitter.on('exit', () => {});
        return runEmitter;
      });
    };
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('pod');
      expect(commandArgs).toStrictEqual(['install']);
      podInstallEmitter.on('message', () => {});
      podInstallEmitter.on('error', (err) => { throw err; });
      podInstallEmitter.on('exit', () => { podsInstallCallback(); });
      return podInstallEmitter;
    });
    build({ '_': ['build'], 'install': false, 'target': 'ios' });
    podInstallEmitter.emit('exit', (null, 0));
  });

  test('should install pods and throw error if code is not 0', () => {
    mockedFs.existsSync.mockReturnValue(true);
    const podInstallEmitter = new events.EventEmitter();
    const runEmitter = new events.EventEmitter();
    const podsInstallCallback = () => {
      child_process.spawn.mockImplementationOnce((command, commandArgs) => {
        expect(command).toBe('react-native');
        expect(commandArgs).toStrictEqual(['run-ios']);
        runEmitter.on('message', () => {});
        runEmitter.on('error', (err) => { throw err; });
        runEmitter.on('exit', () => {});
        return runEmitter;
      });
    };
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('pod');
      expect(commandArgs).toStrictEqual(['install']);
      podInstallEmitter.on('message', () => {});
      podInstallEmitter.on('error', (err) => { throw err; });
      podInstallEmitter.on('exit', () => { podsInstallCallback(); });
      return podInstallEmitter;
    });
    expect(() => {
      build({ '_': ['build'], 'install': false, 'target': 'ios' });
      podInstallEmitter.emit('exit', (null, 0));
      runEmitter.emit('exit', (null, 1));
    }).toThrow();
  });

  test('should throw error on pod install when target is ios and code is not 0', () => {
    mockedFs.existsSync.mockReturnValue(true);
    const podInstallEmitter = new events.EventEmitter();
    podInstallEmitter.stdout = jest.fn();
    podInstallEmitter.on('message', () => {});
    const errorCallback = (err) => { throw err; };
    const exitCallback = jest.fn();
    podInstallEmitter.on('error', errorCallback);
    podInstallEmitter.on('exit', exitCallback);
    const spy = jest.spyOn(podInstallEmitter, 'on').mockImplementation((event, listener) => {});
    child_process.exec.mockImplementationOnce((command) => {
      expect(command.endsWith('/ios && pod install && cd .. && cd ..')).toBeTruthy();
      const errorCallback = (err) => { throw err; };
      podInstallEmitter.on('message', () => {});
      podInstallEmitter.on('error', errorCallback);
      podInstallEmitter.on('exit', exitCallback);
      // return podInstallEmitter;
      return spy;
    });
    expect(() => {
      build({ '_': ['build'], 'install': false, 'target': 'ios' });
      podInstallEmitter.emit('exit', (null, 1));
    }).toThrow();
  });

  test('should throw error on pod install when target is ios and run process throws error', () => {
    mockedFs.existsSync.mockReturnValue(true);
    const podInstallEmitter = new events.EventEmitter();
    podInstallEmitter.stdout = jest.fn();
    podInstallEmitter.on('message', () => {});
    const errorCallback = (err) => { throw err; };
    const exitCallback = jest.fn();
    podInstallEmitter.on('error', errorCallback);
    podInstallEmitter.on('exit', exitCallback);
    const spy = jest.spyOn(podInstallEmitter, 'on').mockImplementation((event, listener) => {});
    child_process.exec.mockImplementationOnce((command) => {
      expect(command.endsWith('/ios && pod install && cd .. && cd ..')).toBeTruthy();
      const errorCallback = (err) => { throw err; };
      podInstallEmitter.on('message', () => {});
      podInstallEmitter.on('error', errorCallback);
      podInstallEmitter.on('exit', exitCallback);
      // return podInstallEmitter;
      return spy;
    });
    expect(() => {
      build({ '_': ['build'], 'install': false, 'target': 'ios' });
      podInstallEmitter.emit('error');
    }).toThrow();
  });

  test('should throw error on run ios if code is not 0', () => {
    mockedFs.existsSync.mockReturnValue(true);
    const podInstallEmitter = new events.EventEmitter();
    const runEmitter = new events.EventEmitter();
    const podsInstallCallback = () => {
      child_process.spawn.mockImplementationOnce((command, commandArgs) => {
        expect(command).toBe('react-native');
        expect(commandArgs).toStrictEqual(['run-ios']);
        runEmitter.on('message', () => {});
        runEmitter.on('error', (err) => { throw err; });
        runEmitter.on('exit', (code, signal) => {
          expect(code).toBe(1);
        });
        return runEmitter;
      });
    };
    child_process.spawn.mockImplementationOnce((command, commandArgs) => {
      expect(command).toBe('pod');
      expect(commandArgs).toStrictEqual(['install']);
      podInstallEmitter.on('message', () => {});
      podInstallEmitter.on('error', (err) => { throw err; });
      podInstallEmitter.on('exit', () => { podsInstallCallback(); });
      return podInstallEmitter;
    });
    build({ '_': ['build'], 'install': false, 'target': 'ios' });
    podInstallEmitter.emit('exit', (null, 0));
    expect(() => {
      runEmitter.emit('exit', (null, 1));
    }).toThrow();
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
    build({ '_': ['build'], 'install': false, 'target': 'lumin' });
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
    build({ '_': ['build'], 'install': false, 'target': 'lumin' });
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
    build({ '_': ['build'], 'target': 'lumin', install: true, path: 'my/path.mpk' });
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
    build({ '_': ['build'], 'target': 'lumin' });
  });

  test('error return code npm install', () => {
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    let proc;
    child_process.spawn.mockImplementationOnce((command, callback) => {
      proc = new child_process.ChildProcess();
      return proc;
    });
    expect(() => {
      build({ '_': ['build'], 'target': 'lumin' });
      proc.emit('exit', 1, null);
    }).toThrow('npm install failed with code: 1');
  });

  test('error signal npm install', () => {
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    let proc;
    child_process.spawn.mockImplementationOnce((command, callback) => {
      proc = new child_process.ChildProcess();
      return proc;
    });
    expect(() => {
      build({ '_': ['build'], 'target': 'lumin' });
      proc.emit('exit', null, 'SIGTERM');
    }).toThrow('npm install failed with signal: SIGTERM');
  });

  test('error process npm install', () => {
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    let proc;
    child_process.spawn.mockImplementationOnce((command, callback) => {
      proc = new child_process.ChildProcess();
      return proc;
    });
    expect(() => {
      build({ '_': ['build'], 'target': 'lumin' });
      proc.emit('error', 'sample process err');
    }).toThrow('sample process err');
  });

  test('no error npm install', () => {
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readdirSync.mockImplementationOnce(() => {
      return ['app.package'];
    });
    util.createDigest = jest.fn().mockReturnValue(false);
    let proc;
    child_process.spawn.mockImplementationOnce((command, callback) => {
      proc = new child_process.ChildProcess();
      return proc;
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe('npm run build');
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe('mabu -t device app.package');
      });
      callback(null);
    });
    build({ '_': ['build'], 'target': 'lumin' });
    proc.emit('exit', 0, null);
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
    build({ '_': ['build'], 'install': false, 'target': 'lumin' });
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
    build({ '_': ['build'], 'install': false, 'target': 'lumin' });
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
    expect(() => build({ '_': ['build'], 'install': false, 'target': 'lumin' })).toThrow();
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
    expect(() => build({ '_': ['build'], 'install': false, 'target': 'lumin' })).toThrow();
  });
});
