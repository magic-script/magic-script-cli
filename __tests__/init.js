jest.mock("fs");

const mockedFs = require("fs");
jest.spyOn(mockedFs, "existsSync");
jest.spyOn(mockedFs, "readFileSync");
const init = require("../commands/init");

beforeEach(() => {
  mockedFs.existsSync = jest.fn();
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
      expect(path.endsWith("file1")).toBeTruthy();
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file2")).toBeTruthy();
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
      expect(path.endsWith("file1")).toBeTruthy();
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("main.js")).toBeTruthy();
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
      expect(path.endsWith("manifest.xml")).toBeTruthy();
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file2")).toBeTruthy();
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
      expect(path.endsWith("manifest.xml")).toBeTruthy();
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file2")).toBeTruthy();
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
      expect(path.endsWith("manifest.xml")).toBeTruthy();
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file2")).toBeTruthy();
    });
    init({ "_": ["init"]});
    expect(mockedFs.mkdirSync).toHaveBeenCalled();
  });

  test("bad project name", () => {
    init({ "_": ["init"], "projectName": "$A"});
    expect(mockedFs.existsSync).not.toHaveBeenCalled();
  });

  test("bad package name", () => {
    init({ "_": ["init"], "packageName": "$A"});
    expect(mockedFs.existsSync).not.toHaveBeenCalled();
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
      expect(path.endsWith("manifest.xml")).toBeTruthy();
    }).mockImplementationOnce((path, contents, type)=>{
      expect(type).toBe("utf8");
      expect(contents).toBe("test2");
      expect(path.endsWith("file1")).toBeTruthy();
    });
    init({ "_": ["init"]});
    expect(mockedFs.mkdirSync).toHaveBeenCalled();
  });
});