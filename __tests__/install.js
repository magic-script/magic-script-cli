// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const child_process = require('child_process');
jest.spyOn(child_process, 'exec');
const util = require('../lib/util');
const install = require('../commands/install');
beforeEach(() => {
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
  util.findPackageName.mockReset();
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
    install({ '_': ['install'], path: 'my/path.mpk', 'target': 'lumin' });
  });


  test('clean install error', () => {
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
    install({ '_': ['install'], path: 'my/path.mpk', 'target': 'lumin' });
  });
});
