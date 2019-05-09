// Copyright 2019 Magic Leap Inc.
// Licensed under Apache 2.0 License. See LICENSE file in the project root for full license information.

var yargs;
var mxsSignUtil;

beforeEach(() => {
  jest.resetModules();
  jest.mock('../util/mxs-sign-util.js');
  mxsSignUtil = require('../util/mxs-sign-util.js');
  jest.mock('yargs');
  yargs = require('yargs');
  yargs.usage = jest.fn().mockImplementation(() => {
    return yargs;
  });
  yargs.strict = jest.fn().mockImplementation(() => {
    return yargs;
  });
  yargs.option = jest.fn().mockImplementation(() => {
    return yargs;
  });
  yargs.alias = jest.fn().mockImplementation(() => {
    return yargs;
  });
  yargs.help = jest.fn().mockImplementation(() => {
    return yargs;
  });
});

describe('Test mxs-signs', () => {
  test('died', () => {
    mxsSignUtil.die = jest.fn().mockImplementation(() => {
      throw 'died';
    });
    Object.defineProperty(yargs, 'argv', {
      configurable: true,
      get: jest.fn(() => {
        return {
          '$0': {},
          'trace': false,
          '_': []
        };
      })
    });
    try {
      require('../util/mxs-sign.js');
    } catch (error) {
      expect(error).toBe('died');
    }
    expect(mxsSignUtil.die).toHaveBeenCalled();
  });

  test('check and die', () => {
    mxsSignUtil.die = jest.fn().mockImplementation(() => {
      throw 'died';
    });
    Object.defineProperty(yargs, 'argv', {
      configurable: true,
      get: jest.fn(() => {
        return {
          '$0': {},
          'trace': false,
          '_': [],
          'check': true
        };
      })
    });
    try {
      require('../util/mxs-sign.js');
    } catch (error) {
      expect(error).toBe('died');
    }
    expect(mxsSignUtil.die).not.toHaveBeenCalled();
  });

  test('check and length', () => {
    mxsSignUtil.die = jest.fn().mockImplementation(() => {
      throw 'died';
    });
    Object.defineProperty(yargs, 'argv', {
      configurable: true,
      get: jest.fn(() => {
        return {
          '$0': {},
          'trace': false,
          '_': [1],
          'check': true
        };
      })
    });
    try {
      require('../util/mxs-sign.js');
    } catch (error) {
      expect(error).toBe('died');
    }
    expect(mxsSignUtil.die).not.toHaveBeenCalled();
  });
  test('no check and length', () => {
    mxsSignUtil.die = jest.fn().mockImplementation(() => {
      throw 'died';
    });
    Object.defineProperty(yargs, 'argv', {
      configurable: true,
      get: jest.fn(() => {
        return {
          '$0': {},
          'trace': false,
          '_': [1]
        };
      })
    });
    try {
      require('../util/mxs-sign.js');
    } catch (error) {
      expect(error).toBe('died');
    }
    expect(mxsSignUtil.die).not.toHaveBeenCalled();
  });
});
