jest.mock('fs');
jest.mock('glob');

const mockedFs = require('fs')
jest.spyOn(mockedFs, "existsSync");
jest.spyOn(mockedFs, "readFileSync");
const child_process = require("child_process");
jest.spyOn(child_process, "exec");
jest.spyOn(child_process, "execFile");
jest.spyOn(child_process, "spawn");
const util = require("../lib/util");
const run = require("../commands/run");
const remove = require("../commands/remove");
const init = require("../commands/init");
const parser = {};
parser.toJson = jest.fn();

const consoleLog = console.log;
const consoleError = console.error;
const consoleWarn = console.warn;

beforeEach(() => {
  mockedFs.existsSync = jest.fn();
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
    mockedFs.existsSync.mockReturnValue(false);
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("manifest.xml doesn't exist in current directory");
    });
    let name = util.findPackageName();
    expect(mockedFs.existsSync).toHaveBeenCalled();
    expect(name).toBe("");
  });

  test("findPackageName manifest com.abc", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementationOnce((path, encoding) => {
      expect(path).toBe("manifest.xml");
      expect(encoding).toBe("utf8");
      return "ml:package=\"com.abc\"";
    });
    let name = util.findPackageName();
    expect(mockedFs.existsSync).toHaveBeenCalled();
    expect(mockedFs.readFileSync).toHaveBeenCalled();
    expect(name === "com.abc").toBeTruthy();
  });

  test("findPackageName manifest null", () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockImplementationOnce((path) => {
      expect(path).toBe("manifest.xml");
      return null;
    });
    let name = util.findPackageName();
    expect(mockedFs.existsSync).toHaveBeenCalled();
    expect(mockedFs.readFileSync).toHaveBeenCalled();
    expect(name === "").toBeTruthy();
  });

  test("createDigest no sign script", () => {
    mockedFs.existsSync.mockReturnValue(false);
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("Signing Script not available");
    });
    util.createDigest(false);
  });

  test("createDigest error signing", () => {
    mockedFs.existsSync.mockReturnValue(true);
    jest.spyOn(console, "error").mockImplementationOnce((data) => {
      expect(data).toBe("error getting installed packages:");
    });
    child_process.execFile.mockImplementationOnce((node, command, cb) => {
      expect(command[0].endsWith("mxs-sign.js")).toBeTruthy();
      cb("err");
    });
    util.createDigest(false);
  });

  test("createDigest signing no error", () => {
    mockedFs.existsSync.mockReturnValue(true);
    jest.spyOn(console, "log").mockImplementationOnce((data) => {
      expect(data).toBe("no error");
    });
    child_process.execFile.mockImplementationOnce((node, command, cb) => {
      expect(command[0].endsWith("mxs-sign.js")).toBeTruthy();
      cb(null, "no error");
    });
    util.createDigest(false);
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

describe("Test Init", () => {
  test("project exists not immersive no manifest", () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    jest.spyOn(mockedFs, "readdirSync").mockImplementationOnce((path)=>{
      return ["file1", "file2"];
    });
    jest.spyOn(mockedFs, "statSync").mockImplementation((path)=>{
      var statObject = {};
      statObject.isFile = function(){ return true;};
      statObject.isDirectory = function(){ return false;};
      return statObject;
    });
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return "test1";
    }).mockImplementationOnce(() => {
      return "test2";
    });
    jest.spyOn(mockedFs, "writeFileSync").mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test1");
      expect(path.endsWith("file1")).toBeTruthy()
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file2")).toBeTruthy()
    });
    init({ "_": ["init"] });
  });

  test("project exists immersive no manifest", () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    jest.spyOn(mockedFs, "readdirSync").mockImplementationOnce((path)=>{
      return ["file1", "main.js"];
    });
    jest.spyOn(mockedFs, "statSync").mockImplementation((path)=>{
      var statObject = {};
      statObject.isFile = function(){ return true;};
      statObject.isDirectory = function(){ return false;};
      return statObject;
    });
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return "test1";
    }).mockImplementationOnce(() => {
      return "test2";
    });
    jest.spyOn(mockedFs, "writeFileSync").mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test1");
      expect(path.endsWith("file1")).toBeTruthy()
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("main.js")).toBeTruthy()
    });
    init({ "_": ["init"], "immersive": true });
  });

  test("project exists not immersive", () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    jest.spyOn(mockedFs, "readdirSync").mockImplementationOnce((path)=>{
      return ["manifest.xml", "file2"];
    });
    jest.spyOn(mockedFs, "statSync").mockImplementation((path)=>{
      var statObject = {};
      statObject.isFile = function(){ return true;};
      statObject.isDirectory = function(){ return false;};
      return statObject;
    });
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return "test1";
    }).mockImplementationOnce(() => {
      return "test2";
    });
    jest.spyOn(mockedFs, "writeFileSync").mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test1");
      expect(path.endsWith("manifest.xml")).toBeTruthy()
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file2")).toBeTruthy()
    });
    init({ "_": ["init"] });
  });

  test("project exists immersive", () => {
    mockedFs.existsSync.mockReturnValueOnce(true);
    jest.spyOn(mockedFs, "readdirSync").mockImplementationOnce((path)=>{
      return ["manifest.xml", "file2"];
    });
    jest.spyOn(mockedFs, "statSync").mockImplementation((path)=>{
      var statObject = {};
      statObject.isFile = function(){ return true;};
      statObject.isDirectory = function(){ return false;};
      return statObject;
    });
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return "test1";
    }).mockImplementationOnce(() => {
      return "test2";
    });
    jest.spyOn(mockedFs, "writeFileSync").mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test1");
      expect(path.endsWith("manifest.xml")).toBeTruthy()
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file2")).toBeTruthy()
    });
    init({ "_": ["init"], "immersive": true });
  });

  test("no project exists", () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    jest.spyOn(mockedFs, "readdirSync").mockImplementationOnce((path)=>{
      return ["manifest.xml", "file2"];
    });
    jest.spyOn(mockedFs, "statSync").mockImplementation((path)=>{
      var statObject = {};
      statObject.isFile = function(){ return true;};
      statObject.isDirectory = function(){ return false;};
      return statObject;
    });
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return "test1";
    }).mockImplementationOnce(() => {
      return "test2";
    });
    jest.spyOn(mockedFs, "writeFileSync").mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test1");
      expect(path.endsWith("manifest.xml")).toBeTruthy()
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file2")).toBeTruthy()
    });
    init({ "_": ["init"]});
    expect(mockedFs.mkdirSync).toBeCalled()
  });

  test("bad project name", () => {
    init({ "_": ["init"], "projectName": "$A"});
    expect(mockedFs.existsSync).not.toBeCalled();
  });

  test("bad package name", () => {
    init({ "_": ["init"], "packageName": "$A"});
    expect(mockedFs.existsSync).not.toBeCalled();
  });

  test("no project exists with subdir", () => {
    mockedFs.existsSync.mockReturnValue(false);
    jest.spyOn(mockedFs, "readdirSync").mockImplementationOnce((path)=>{
      return ["manifest.xml", "folder"];
    }).mockImplementationOnce((path)=>{
      return ["file1"];
    });
    jest.spyOn(mockedFs, "statSync").mockImplementation((path)=>{
      var statObject = {};
      console.log(path)
      statObject.isFile = function(){
        if(path.endsWith("folder")) {
          return false;
        } else {
          return true;
        }
      };
      statObject.isDirectory = function(){ return true;};
      return statObject;
    });
    mockedFs.readFileSync.mockImplementationOnce(() => {
      return "test1";
    }).mockImplementationOnce(() => {
      return "test2";
    });
    jest.spyOn(mockedFs, "writeFileSync").mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test1");
      expect(path.endsWith("manifest.xml")).toBeTruthy()
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file1")).toBeTruthy()
    });
    init({ "_": ["init"]});
    expect(mockedFs.mkdirSync).toBeCalled()
  });
});