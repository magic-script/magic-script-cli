jest.mock('fs');
jest.mock('../lib/logger');
jest.mock('node-replace');
jest.mock('path');

const mockedPath = require('path');
const mockedFs = require('fs');
const renameUtils = require('../lib/rename/renameutils');
const logger = require('../lib/logger');
const mockedReplace = require('node-replace');

afterEach(() => {
  jest.resetAllMocks();
});

describe('Test init utils methods', () => {
  function createStat(isFile) {
    var statObject = {};
    statObject.isFile = function () {
      return isFile;
    };
    statObject.isDirectory = function () {
      return !isFile;
    };
    return statObject;
  }

  test('should copy files with utf8', () => {
    mockedFs.existsSync.mockReturnValueOnce(false);
    mockedFs.readdirSync.mockReturnValueOnce(['manifest.xml', 'file']);
    mockedFs.statSync
      .mockReturnValueOnce(createStat(true))
      .mockReturnValueOnce(createStat(true));
    mockedFs.readFileSync
      .mockReturnValueOnce('content')
      .mockReturnValueOnce('fileContent');

    renameUtils.copyFiles('srcPath', 'destPath');

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith('destPath');
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      'destPath/manifest.xml',
      'content',
      'utf8'
    );
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      'destPath/file',
      'fileContent',
      'utf8'
    );
  });

  test('should recursively call copy files when is directory', () => {
    mockedFs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);
    mockedFs.readdirSync
      .mockReturnValueOnce(['directory'])
      .mockReturnValueOnce([]);
    mockedFs.statSync.mockReturnValueOnce(createStat(false));
    mockedFs.readFileSync.mockReturnValueOnce('');

    renameUtils.copyFiles('srcPath', 'destPath');

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith('destPath');
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith('destPath/directory');
  });

  test('should write to file when copyFileOrDir operates on file', () => {
    mockedFs.statSync.mockReturnValueOnce(createStat(true));
    mockedFs.readFileSync.mockReturnValueOnce('content');

    renameUtils.copyFileOrDir('file', 'destPath');

    expect(mockedFs.readFileSync).toHaveBeenCalledWith('file', 'utf8');
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      'destPath',
      'content',
      'utf8'
    );
  });

  test('should call copyFiles when copyFileOrDir operates on directory', () => {
    mockedFs.statSync.mockReturnValueOnce(createStat(false));
    mockedFs.readFileSync.mockReturnValueOnce('content');
    renameUtils.copyFiles = jest.fn();

    renameUtils.copyFileOrDir('directory', 'destPath');

    expect(renameUtils.copyFiles).toHaveBeenCalled();
  });

  it('should not delete directory if bundle was not changed', async () => {
    const oldBundleNameDir = 'oldBundleName';
    const shouldDelete = false;
    const payload = {
      oldBundleNameDir,
      shouldDelete
    };
    expect.assertions(1);
    return expect(
      renameUtils.deletePreviousBundleDirectory(payload)
    ).resolves.toBe();
  });

  it('should delete directory if bundle was changed', async () => {
    const oldBundleNameDir = 'oldBundleName';
    const shouldDelete = true;
    const payload = {
      oldBundleNameDir,
      shouldDelete
    };
    mockedFs.unlinkSync.mockReturnValueOnce(true);
    expect.assertions(1);
    return expect(
      renameUtils.deletePreviousBundleDirectory(payload)
    ).resolves.toBeTruthy();
  });

  it('should read file successfully', async () => {
    const filePath = 'filePath';

    mockedFs.readFile.mockImplementationOnce((path, callback) => {
      callback(null, 'data');
    });
    expect.assertions(1);
    return expect(renameUtils.readFile(filePath)).resolves.toBeTruthy();
  });

  it('should read file unsuccessfully', async () => {
    const filePath = 'filePath';

    mockedFs.readFile.mockImplementationOnce((path, callback) => {
      callback(new Error('error'), null);
    });
    expect.assertions(1);
    return expect(renameUtils.readFile(filePath)).rejects.toBeTruthy();
  });

  it('should replace content', () => {
    const regex = 'regex';
    const replacement = 'replacement';
    const paths = ['path1', 'path2'];

    renameUtils.replaceContent(regex, replacement, paths);

    expect(mockedReplace).toHaveBeenCalled();
    expect(logger.green).toHaveBeenNthCalledWith(1, 'path1 MODIFIED');
    expect(logger.green).toHaveBeenNthCalledWith(2, 'path2 MODIFIED');
  });

  it('should unlink if is file', () => {
    const path = 'path';
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.lstatSync.mockReturnValueOnce(createStat(true));

    renameUtils.deleteFiles(path);

    expect(mockedFs.existsSync).toHaveBeenCalledWith(path);
    expect(mockedFs.lstatSync).toHaveBeenCalledWith(path);
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith(path);
  });

  it('should unlink new path if is directory', () => {
    const path = 'path';
    mockedFs.existsSync.mockReturnValueOnce(true);
    mockedFs.lstatSync
      .mockReturnValueOnce(createStat(false))
      .mockReturnValueOnce(createStat(true));
    mockedFs.readdirSync.mockReturnValueOnce(['file1']);

    renameUtils.deleteFiles(path);

    expect(mockedFs.existsSync).toHaveBeenCalledWith(path);
    expect(mockedFs.lstatSync).toHaveBeenCalledWith(path);
    expect(mockedFs.lstatSync).toHaveBeenCalledWith('path/file1');
    expect(mockedFs.readdirSync).toHaveBeenCalledWith(path);
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith('path/file1');
    expect(mockedFs.rmdirSync).toHaveBeenCalledWith(path);
  });

  it('should recurrent new path if is directory', () => {
    const path = 'path';
    mockedFs.existsSync.mockReturnValueOnce(true).mockImplementationOnce(false);
    mockedFs.lstatSync
      .mockReturnValueOnce(createStat(false))
      .mockReturnValueOnce(createStat(false));
    mockedFs.readdirSync.mockReturnValueOnce(['innerPath']);

    renameUtils.deleteFiles(path);

    expect(mockedFs.existsSync).toHaveBeenCalledWith(path);
    expect(mockedFs.lstatSync).toHaveBeenCalledWith(path);
    expect(mockedFs.lstatSync).toHaveBeenCalledWith('path/innerPath');
    expect(mockedFs.readdirSync).toHaveBeenCalledWith(path);
    expect(mockedFs.rmdirSync).toHaveBeenCalledWith(path);
    expect(mockedFs.existsSync).toHaveBeenCalledWith('path/innerPath');
  });

  it('should not clean builds if unlink throws error', async () => {
    mockedPath.join.mockReturnValueOnce('filePath');
    mockedFs.unlinkSync.mockImplementationOnce((path) => {
      throw new Error('clean build error');
    });

    expect.assertions(1);
    return expect(renameUtils.cleanBuilds('filePath')).rejects.toBeTruthy();
  });

  it('should clean builds', async () => {
    mockedPath.join.mockReturnValue('filePath');

    expect.assertions(1);
    return expect(renameUtils.cleanBuilds('filePath')).resolves.toBeTruthy();
  });
});
