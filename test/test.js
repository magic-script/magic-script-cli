const fs = require("fs");
jest.spyOn(fs, "existsSync");
jest.spyOn(fs, "readFileSync");
const child_process = require("child_process");
jest.spyOn(child_process, "exec");
jest.spyOn(child_process, "execFile");
jest.spyOn(child_process, "spawn");
const util = require("../lib/util");
const chrome = require("selenium-webdriver/chrome");
const ChromeLauncher = require("../lib/chromeLaunch");
const run = require("../commands/run");
const remove = require("../commands/remove");
const parser = {};
parser.toJson = jest.fn();

const consoleLog = console.log;
const consoleError = console.error;
const consoleWarn = console.warn;

beforeEach(() => {
  fs.existsSync = jest.fn();
});

afterEach(() => {
  console.log = consoleLog;
  console.error = consoleError;
  console.warn = consoleWarn;
});

describe("Test Util", () => {

  test("isInstalled error", () => {
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("error getting installed packages:");
    });
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe("mldb packages -j");
    });
    util.isInstalled("com.abc", function (result) {
      expect(result).toBeFalsy();
    });
    expect(child_process.exec.mock.calls.length).toBe(1);
    let call = child_process.exec.mock.calls[0];
    if (call) {
      expect(call[0]).toBe("mldb packages -j");
      call[1](true);
    }
  });

  test("isInstalled no match", () => {
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe("mldb packages -j");
    });
    util.isInstalled("com.abc", function (result) {
      expect(result).toBeFalsy();
    });
    expect(child_process.exec.mock.calls.length).toBe(1);
    let call = child_process.exec.mock.calls[0];
    if (call && call.length > 1) {
      expect(call[0]).toBe("mldb packages -j");
      call[1](0, "[{\"asdf\":1 }]");
    }
  });

  test("isInstalled match", () => {
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe("mldb packages -j");
    });
    util.isInstalled("com.abc", function (result) {
      expect(result).toBeTruthy();
    });
    expect(child_process.exec.mock.calls.length).toBe(1);
    let call = child_process.exec.mock.calls[0];
    if (call && call.length > 1) {
      expect(call[0]).toBe("mldb packages -j");
      call[1](0, "[{\"package\":\"com.abc\" }]");
    }
  });

  test("isInstalled parse error", () => {
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("Failed to parse packages JSON");
    });
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe("mldb packages -j");
    });
    util.isInstalled("com.abc", function (result) {
      expect(result).toBeFalsy();
    });
    expect(child_process.exec.mock.calls.length).toBe(1);
    let call = child_process.exec.mock.calls[0];
    if (call && call.length > 1) {
      expect(call[0]).toBe("mldb packages -j");
      call[1](0, null);
    }
  });

  test("findPackageName no manifest", () => {
    fs.existsSync.mockReturnValue(false);
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("manifest.xml doesn't exist in current directory");
    });
    let name = util.findPackageName();
    expect(fs.existsSync).toHaveBeenCalled();
    expect(name).toBe("");
  });

  test("findPackageName manifest com.abc", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementationOnce((path, encoding) => {
      expect(path).toBe("manifest.xml");
      expect(encoding).toBe("utf8");
      return "ml:package=\"com.abc\"";
    });
    let name = util.findPackageName();
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(name === "com.abc").toBeTruthy();
  });

  test("findPackageName manifest null", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementationOnce((path) => {
      expect(path).toBe("manifest.xml");
      return null;
    });
    let name = util.findPackageName();
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
    expect(name === "").toBeTruthy();
  });

  test("createDigest no sign script", () => {
    fs.existsSync.mockReturnValue(false);
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("Signing Script not available");
    });
    util.createDigest();
  });

  test("createDigest error signing", () => {
    fs.existsSync.mockReturnValue(true);
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("error getting installed packages:");
    });
    child_process.execFile.mockImplementationOnce((node, command, cb) => {
      expect(command[0].endsWith("mxs-sign.js")).toBeTruthy();
      cb("err");
    });
    util.createDigest();
  });

  test("createDigest signing no error", () => {
    fs.existsSync.mockReturnValue(true);
    jest.spyOn(console, "log").mockImplementationOnce((data) => {
      expect(data).toBe("no error");
    });
    child_process.execFile.mockImplementationOnce((node, command, cb) => {
      expect(command[0].endsWith("mxs-sign.js")).toBeTruthy();
      cb(null, "no error");
    });
    util.createDigest();
  });
});

describe("Test chromeLaunch", () => {
  test("chromeLaunch open", () => {
    let thisService = { "thisService": 1 };
    let buildFunction = {
      "build": function () {
        return thisService;
      }
    };
    chrome.ServiceBuilder = jest.fn().mockImplementationOnce((path) => {
      expect(typeof path).toBe("string");
      return buildFunction;
    });
    chrome.Driver.createSession = jest.fn().mockImplementationOnce((options, service) => {
      expect(service).toBe(thisService);
      let get = function (url) {
        expect(url).toBe("myURL");
      };
      return { "get": get };
    });
    const launcher = new ChromeLauncher();
    launcher.open("myURL");
  });
});
describe("Test Run", () => {

  test("not installed \"com.abc\"", () => {
    jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(false);
    });
    jest.spyOn(console, "warn").mockImplementationOnce((data) => {
      expect(data).toBe("Package: com.abc is not installed.  Please install it.");
    });
    run({ "_": ["run", "com.abc"] });
  });

  test("not installed \"com.abc\" running", () => {
    jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(false);
    });
    jest.spyOn(console, "warn").mockImplementationOnce((data) => {
      expect(data).toBe("Package: com.abc is not installed.  Please install it.");
    });
    run({ "_": ["run", "com.abc"] });
  });

  test("no packageName", () => {
    const mockFindPackageName = jest.spyOn(util, "findPackageName").mockReturnValue("");
    run({ "_": ["run"] });
    expect(mockFindPackageName).toHaveBeenCalled();
  });

  test("Installed \"com.abc\"", () => {
    const mockIsInstalled = jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(true);
    });
    child_process.exec.mockImplementationOnce((command, cb) => {
      expect(command).toBe("mldb ps");
    });
    run({ "_": ["run", "com.abc"] });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
    if (child_process.exec.mock.calls.length > 0) {
      expect(child_process.exec.mock.calls[0][0]).toBe("mldb ps");
    }
  });

  test("Installed \"com.abc\" running", () => {
    const mockIsInstalled = jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, "info").mockImplementationOnce((data) => {
      expect(data).toBe("Terminating:");
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("mldb ps");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mldb terminate com.abc");
      });
      callback(null, "1440 110011 Running com.abc .universe");
    });
    run({ "_": ["run", "com.abc"] });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test("Installed \"com.abc\" running error", () => {
    const mockIsInstalled = jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, "info").mockImplementationOnce((data) => {
      expect(data).toBe("Launching:");
    });
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("exec error: error");
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("mldb ps");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mldb launch com.abc");
      });
      callback("error");
    });
    run({ "_": ["run", "com.abc"] });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test("Installed \"com.abc\" running error launch", () => {
    const mockIsInstalled = jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, "info").mockImplementationOnce((data) => {
      expect(data).toBe("Launching:");
    });
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("exec error: error");
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("mldb ps");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mldb launch com.abc");
        callback("error");
      });
      callback("error");
    });
    run({ "_": ["run", "com.abc"] });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test("Installed \"com.abc\" running launch log error", () => {
    child_process.spawn.mockImplementationOnce(() => {
      let stdout = function (data, callback) {
        expect(data).toBe("data");
      };
      let stderr = function (data, callback) {
        expect(data).toBe("data");
        callback("error");
      };
      return { "stderr": { "on": stderr }, "stdout": { "on": stdout } };
    });
    const mockIsInstalled = jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, "info").mockImplementationOnce((data) => {
      expect(data).toBe("Launching:");
    });
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("exec error: error");
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("mldb ps");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mldb launch --auto-net-privs com.abc");
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe("mldb ps");
          callback(null, "1440 110011 Running com.abc .universe");
        });
        callback(null, "Success");
      });
      callback("error");
    });
    run({ "_": ["run", "com.abc"], "debug": true });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test("Installed \"com.abc\" running launch log", () => {
    child_process.spawn.mockImplementationOnce(() => {
      let stdout = function (data, callback) {
        expect(data).toBe("data");
        callback("1440 chrome://asdf:12345");
      };
      let stderr = function (data, callback) {
        expect(data).toBe("data");
      };
      let kill = function () { };
      return { "stderr": { "on": stderr }, "stdout": { "on": stdout }, "kill": kill };
    });
    const mockIsInstalled = jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, "info").mockImplementationOnce((data) => {
      expect(data).toBe("Launching:");
    });
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("exec error: error");
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("mldb ps");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mldb launch --auto-net-privs com.abc");
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe("mldb ps");
          callback(null, "1440 110011 Running com.abc .universe");
        });
        callback(null, "Success");
      });
      callback("error");
    });
    run({ "_": ["run", "com.abc"], "debug": true });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test("Installed \"com.abc\" running launch log exec error", () => {
    child_process.spawn.mockImplementationOnce(() => {
      let stdout = function (data, callback) {
        expect(data).toBe("data");
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe("mldb forward tcp:12345 tcp:12345");
          callback("error");
        });
        callback("1440 chrome://asdf:12345");
      };
      let stderr = function (data, callback) {
        expect(data).toBe("data");
      };
      let kill = function () { };
      return { "stderr": { "on": stderr }, "stdout": { "on": stdout }, "kill": kill };
    });
    const mockIsInstalled = jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, "info").mockImplementationOnce((data) => {
      expect(data).toBe("Launching:");
    });
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("exec error: error");
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("mldb ps");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mldb launch --auto-net-privs com.abc");
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe("mldb ps");
          callback(null, "1440 110011 Running com.abc .universe");
        });
        callback(null, "Success");
      });
      callback("error");
    });
    run({ "_": ["run", "com.abc"], "debug": true });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });

  test("Installed \"com.abc\" running launch log exec success", () => {
    child_process.spawn.mockImplementationOnce(() => {
      let stdout = function (data, callback) {
        expect(data).toBe("data");
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe("mldb forward tcp:12345 tcp:12345");
          // callback(null, "", "")
        });
        callback("1440 chrome://asdf:12345");
      };
      let stderr = function (data, callback) {
        expect(data).toBe("data");
      };
      let kill = function () { };
      return { "stderr": { "on": stderr }, "stdout": { "on": stdout }, "kill": kill };
    });
    const mockIsInstalled = jest.spyOn(util, "isInstalled").mockImplementationOnce((packageName, callback) => {
      expect(packageName == "com.abc").toBeTruthy();
      callback(true);
    });
    jest.spyOn(console, "info").mockImplementationOnce((data) => {
      expect(data).toBe("Launching:");
    });
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("exec error: error");
    });
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("mldb ps");
      child_process.exec.mockImplementationOnce((command, callback) => {
        expect(command).toBe("mldb launch --auto-net-privs com.abc");
        child_process.exec.mockImplementationOnce((command, callback) => {
          expect(command).toBe("mldb ps");
          callback(null, "1440 110011 Running com.abc .universe");
        });
        callback(null, "Success");
      });
      callback("error");
    });
    run({ "_": ["run", "com.abc"], "debug": true });
    expect(mockIsInstalled).toHaveBeenCalled();
    expect(child_process.exec).toHaveBeenCalled();
  });
});
describe("Test Remove", () => {
  test("error", () => {
    jest.spyOn(console, "log").mockImplementationOnce((data) => {
      expect(data).toBe("mldb uninstall com.abc");
    });
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("Error:");
    });
    const mockFindPackageName = jest.spyOn(util, "findPackageName").mockReturnValue("com.abc");
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("mldb uninstall com.abc");
      callback("error");
    });
    remove({ "_": ["remove", "com.abc"] });
    expect(mockFindPackageName).toHaveBeenCalled();
  });

  test("no error", () => {
    jest.spyOn(console, "log").mockImplementationOnce((data) => {
      expect(data).toBe("mldb uninstall com.abc");
    });
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("Error:");
    });
    const mockFindPackageName = jest.spyOn(util, "findPackageName").mockReturnValue("com.abc");
    child_process.exec.mockImplementationOnce((command, callback) => {
      expect(command).toBe("mldb uninstall com.abc");
      callback(null);
    });
    remove({ "_": ["remove", "com.abc"] });
    expect(mockFindPackageName).toHaveBeenCalled();
  });
});