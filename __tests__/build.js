// Copyright 2019 Magic Leap Inc.
// Distributed under MIT License. See LICENSE file in the project root for full license information.
jest.mock("fs");
jest.mock("glob");

const mockedFs = require("fs");
jest.spyOn(mockedFs, "existsSync");
jest.spyOn(mockedFs, "readFileSync");
jest.spyOn(mockedFs, "readdirSync");
const child_process = require("child_process");
jest.spyOn(child_process, "exec");
const util = require("../lib/util");
const build = require("../commands/build");

beforeEach(() => {
  mockedFs.existsSync = jest.fn();
  mockedFs.readdirSync = jest.fn();
});

afterEach(() => {
  if (util.isInstalled.mock) {
    util.isInstalled.mockRestore();
  }
});

describe("Test build", () => {
  test("error npm run", () => {
    mockedFs.existsSync.mockReturnValue(true);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("npm run build");
      callback("error");
    });
    build({ "_": ["build"], "install": false });
  });

  test("error mabu", () => {
    mockedFs.existsSync.mockReturnValue(true);
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("npm run build");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mabu -t device app.package");
        callback("error");
      });
      callback(null);
    });
    build({ "_": ["build"], "install": false });
  });

  test("no error no install", () => {
    mockedFs.existsSync.mockReturnValue(true);
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("npm run build");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mabu -t device app.package");
        callback(null,"out.mpk");
      });
      callback(null);
    });
    build({ "_": ["build"], "install": false });
  });

  test("no error mldb install", () => {
    mockedFs.existsSync.mockReturnValue(true);
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("npm run build");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mabu -t device app.package");
        jest.spyOn(util, "findPackageName").mockReturnValueOnce("com.abc");
        util.isInstalled = jest.fn().mockImplementationOnce((packageName, callback) => {
          expect(packageName).toBe("com.abc");
          callback(false);
        });
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe("mldb install  ");
          callback(null);
        });
        callback(null,"out.mpk");
      });
      callback(null);
    });
    build({ "_": ["build"], "install": true });
  });

  test("error mldb install", () => {
    mockedFs.existsSync.mockReturnValue(true);
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("npm run build");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mabu -t device app.package");
        jest.spyOn(util, "findPackageName").mockReturnValueOnce("com.abc");
        util.isInstalled = jest.fn().mockImplementationOnce((packageName, callback) => {
          expect(packageName).toBe("com.abc");
          callback(false);
        });
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe("mldb install  ");
          callback("error");
        });
        callback(null,"out.mpk");
      });
      callback(null);
    });
    build({ "_": ["build"], "install": true });
  });

  test("error npm install", () => {
    mockedFs.existsSync.mockReturnValue(false);
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("npm install");
      callback("error");
    });
    build({ "_": ["build"], "install": true });
  });

  test("no error npm install", () => {
    mockedFs.existsSync.mockReturnValue(false);
    util.createDigest = jest.fn().mockReturnValue(false);
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("npm install");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("npm run build");
      });
      callback(null);
    });
    build({ "_": ["build"], "install": true });
  });
});
