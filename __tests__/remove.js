// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under MIT License. See LICENSE file in the project root for full license information.
jest.mock("glob");

const child_process = require("child_process");
jest.spyOn(child_process, "exec");
const util = require("../lib/util");
const remove = require("../commands/remove");

const consoleLog = console.log;
const consoleError = console.error;


afterEach(() => {
  console.log = consoleLog;
  console.error = consoleError;
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
