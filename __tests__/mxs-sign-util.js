// Copyright 2019 Magic Leap Inc.
// Licensed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const path = require("path");
const which = require("which");

jest.mock('fs');

const mockedFs = require('fs');

const child_process = require('child_process');
jest.spyOn(child_process, 'execFile');
jest.spyOn(child_process, 'exec');
var execFile = child_process.execFile;
var exec = child_process.exec;
let mxsSignUtil = require('../util/mxs-sign-util.js');

describe('Test mxs-sign-util', () => {
  test('trace disabled', () => {
    jest.spyOn(console, 'debug');
    mxsSignUtil.trace("test");
    expect(console.debug).not.toHaveBeenCalled();
  });

  test('trace enabled', () => {
    jest.spyOn(console, 'debug');
    mxsSignUtil.displayTrace = true;
    mxsSignUtil.trace("test");
    expect(console.debug).toHaveBeenCalled();
  });

  test('warn message', () => {
    jest.spyOn(console, 'warn');
    mxsSignUtil.warn("test");
    expect(console.warn).toHaveBeenCalled();
  });

  test('die string message', () => {
    jest.spyOn(console, 'error');
    var originalExit = process.exit;
    process.exit = jest.fn();
    mxsSignUtil.die("test");
    expect(console.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(255);
    process.exit = originalExit;
  });

  test('die object message', () => {
    jest.spyOn(console, 'error');
    var originalExit = process.exit;
    process.exit = jest.fn();
    mxsSignUtil.die({"asdf":"test"});
    expect(console.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(255);
    process.exit = originalExit;
  });

  test('checkModulePaths no error', () => {
    let array = ["test1", "test2"];
    jest.spyOn(mxsSignUtil, 'checkModulePaths');
    jest.spyOn(path, 'isAbsolute').mockImplementationOnce(() => {
      return false;
    });
    mxsSignUtil.checkModulePaths(array);
    expect(mxsSignUtil.checkModulePaths).toHaveBeenCalled();
  });

  test('checkModulePaths error isAbsolute', () => {
    let array = ["test1", "test2"];
    jest.spyOn(mxsSignUtil, 'checkModulePaths');
    jest.spyOn(path, 'isAbsolute').mockImplementationOnce(() => {
      return true;
    });
    try {
      mxsSignUtil.checkModulePaths(array);
    } catch (err) {
      expect(err).toEqual("can't sign absolute path: test1");
    }
  });

  test('checkModulePaths error non-normalized', () => {
    let array = ["../../test1", "test2"];
    jest.spyOn(mxsSignUtil, 'checkModulePaths');
    jest.spyOn(path, 'isAbsolute').mockImplementationOnce(() => {
      return false;
    });
    try {
      mxsSignUtil.checkModulePaths(array);
    } catch (err) {
      expect(err).toEqual("can't sign non-normalized path: ../../test1");
    }
  });

  test('checkUnsignedDigest no error', () => {
    let array = ["test1", "test2"];
    jest.spyOn(mockedFs, 'readFileSync').mockImplementationOnce((data)=> {
      return `${mxsSignUtil.DIGEST_CONTENT_HEADER}\0asdf`;
    });
    jest.spyOn(mxsSignUtil, 'checkUnsignedDigest');
    try {
      mxsSignUtil.checkUnsignedDigest(array);
      expect(true).toBeTruthy();
    } catch (err) {
      expect(false).toBeTruthy();
    }
  });

  test('checkUnsignedDigest error', () => {
    let array = ["test1", "test2"];
    jest.spyOn(mockedFs, 'readFileSync').mockImplementationOnce((data)=> {
      return `test\0asdf`;
    });
    jest.spyOn(mxsSignUtil, 'checkUnsignedDigest');
    try {
      mxsSignUtil.checkUnsignedDigest(array);
      expect(false).toBeTruthy();
    } catch (err) {
      expect(err).toBe("bad header in digest file: digest.sha512.signed");
    }
  });

  test('createUnsignedDigest', () => {
    let array = ["test1"];
    jest.spyOn(mockedFs, 'openSync').mockImplementationOnce(() => {
      return "fileDescritor";
    });
    jest.spyOn(mockedFs, 'writeSync').mockImplementationOnce(() => {
    });
    jest.spyOn(mockedFs, 'closeSync').mockImplementationOnce(() => {
    });
    jest.spyOn(mockedFs, 'readFileSync').mockImplementationOnce(() => {
      return "asdf";
    });
    jest.spyOn(mxsSignUtil, 'createUnsignedDigest');
    try {
      mxsSignUtil.createUnsignedDigest(array);
      expect(true).toBeTruthy();
    } catch (err) {
      expect(false).toBeTruthy();
    }
  });

  test('signDigest missing MLCERT', () => {
    delete process.env['MLCERT'];
    jest.spyOn(which, 'sync').mockImplementationOnce(() => {
      return '/asdf/mabu';
    });
    try {
      mxsSignUtil.signDigest();
    } catch (err) {
      expect(err).toBe('missing $MLCERT');
    }
  });

  test('signDigest no debug', () => {
    process.env['MLCERT'] = 'test';
    jest.spyOn(which, 'sync').mockImplementationOnce(() => {
      return '/asdf/mabu';
    });
    execFile.mockImplementationOnce((node, command, cb) => {
      expect(node.includes('sign-file')).toBeTruthy();
      cb();
    });
    try {
      mxsSignUtil.signDigest();
      expect(true).toBe(true);
    } catch (err) {
      expect(err).toBe(null);
      console.error(err);
    }
    mockedFs.accessSync.mockReset();
  });

  test('signDigest no debug error', () => {
    process.env['MLCERT'] = 'test';
    jest.spyOn(which, 'sync').mockImplementationOnce(() => {
      return '/asdf/mabu';
    });
    execFile.mockImplementationOnce((node, command, cb) => {
      expect(node.includes('sign-file')).toBeTruthy();
      cb("error with sign-file");
    });
    try {
      mxsSignUtil.signDigest();
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBe("error with sign-file");
    }
    mockedFs.accessSync.mockReset();
  });

  test('signDigest debug', () => {
    process.env['MLCERT'] = 'test';
    jest.spyOn(which, 'sync').mockImplementationOnce(() => {
      return '/asdf/mabu';
    });
    execFile.mockImplementationOnce((node, command, cb) => {
      expect(node.includes('sign-file')).toBeTruthy();
      cb();
    });
    exec.mockImplementationOnce((node, cb) => {
      expect(node.includes('python')).toBeTruthy();
      cb();
    });
    try {
      mxsSignUtil.signDigest(true);
      expect(true).toBe(true);
    } catch (err) {
      expect(err).toBe(null);
      console.error(err);
    }
    mockedFs.accessSync.mockReset();
  });

  test('signDigest debug stderr', () => {
    process.env['MLCERT'] = 'test';
    var originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    });
    jest.spyOn(which, 'sync').mockImplementationOnce(() => {
      return '/asdf/mabu';
    });
    execFile.mockImplementationOnce((node, command, cb) => {
      expect(node.includes('sign-file')).toBeTruthy();
      cb();
    });
    exec.mockImplementationOnce((node, cb) => {
      expect(node.includes('python')).toBeTruthy();
      var error = console.error;
      console.error = jest.fn().mockImplementation((log, data) => {
        expect(log).toBe('Error Adding tail data:');
        expect(data).toBe('stderr');
      });
      cb(null, null, "stderr");
      console.error = error;
    });
    try {
      mxsSignUtil.signDigest(true);
      expect(true).toBe(true);
    } catch (err) {
      expect(err).toBe(null);
      console.error(err);
    }
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
    mockedFs.accessSync.mockReset();
  });

  test('signDigest debug err', () => {
    process.env['MLCERT'] = 'test';
    jest.spyOn(which, 'sync').mockImplementationOnce(() => {
      return '/asdf/mabu';
    });
    execFile.mockImplementationOnce((node, command, cb) => {
      expect(node.includes('sign-file')).toBeTruthy();
      cb();
    });
    exec.mockImplementationOnce((node, cb) => {
      expect(node.includes('python')).toBeTruthy();
      var error = console.error;
      console.error = jest.fn().mockImplementation((log, data) => {
        expect(log).toBe('Error Adding tail data:');
        expect(data).toBe('err');
      });
      cb('err');
      console.error = error;
    });
    try {
      mxsSignUtil.signDigest(true);
      expect(true).toBe(true);
    } catch (err) {
      expect(err).toBe(null);
      console.error(err);
    }
    mockedFs.accessSync.mockReset();
  });
});
