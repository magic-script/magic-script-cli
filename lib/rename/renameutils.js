let fs = require('fs');
let logger = require('../logger');
let path = require('path');
let replace = require('node-replace');

const replaceOptions = {
  recursive: true,
  silent: true
};

module.exports.copyFiles = function (srcPath, destPath) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }
  const filesToCreate = fs.readdirSync(srcPath);
  filesToCreate.forEach((file) => {
    const origFilePath = `${srcPath}/${file}`;
    const stats = fs.statSync(origFilePath);
    if (stats.isFile()) {
      var contents = fs.readFileSync(origFilePath, 'utf8');
      const writePath = `${destPath}/${file}`;
      fs.writeFileSync(writePath, contents, 'utf8');
    } else if (stats.isDirectory()) {
      let newDestPath = `${destPath}/${file}`;
      module.exports.copyFiles(origFilePath, newDestPath);
    }
  });
};

module.exports.copyFileOrDir = function (element, destPath) {
  const stats = fs.statSync(element);
  if (stats.isFile()) {
    var contents = fs.readFileSync(element, 'utf8');
    fs.writeFileSync(destPath, contents, 'utf8');
  } else if (stats.isDirectory()) {
    module.exports.copyFiles(element, destPath);
  }
};

module.exports.deletePreviousBundleDirectory = async function ({
  oldBundleNameDir,
  shouldDelete
}) {
  return new Promise((resolve) => {
    if (shouldDelete) {
      const dir = oldBundleNameDir.replace(/\./g, '/');
      const deleteDirectory = fs.unlinkSync(dir);
      logger.green('Done removing previous bundle directory.');
      resolve(deleteDirectory);
    } else {
      logger.yellow('Bundle directory was not changed. Keeping...');
      resolve();
    }
  });
};

module.exports.readFile = function (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
};

module.exports.replaceContent = function (regex, replacement, paths) {
  replace({
    regex,
    replacement,
    paths,
    ...replaceOptions
  });
};

module.exports.deleteFiles = function (path) {
  var files = [];
  if (fs.existsSync(path)) {
    if (fs.lstatSync(path).isFile()) {
      fs.unlinkSync(path);
    } else {
      files = fs.readdirSync(path);
      files.forEach(function (file, index) {
        var curPath = path + '/' + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          module.exports.deleteFiles(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }
};

module.exports.cleanBuilds = function (dirPath) {
  return new Promise((resolve, reject) => {
    try {
      fs.unlinkSync(path.join(dirPath, 'ios/build/*'));
      fs.unlinkSync(path.join(dirPath, 'android/.gradle/*'));
      fs.unlinkSync(path.join(dirPath, 'android/app/build/*'));
      fs.unlinkSync(path.join(dirPath, 'android/build/*'));
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
