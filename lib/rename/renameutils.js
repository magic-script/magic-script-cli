let fs = require('fs');
let logger = require('../logger');
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

module.exports.deletePreviousBundleDirectory = function ({
  oldBundleNameDir,
  shouldDelete
}) {
  if (shouldDelete) {
    const dir = oldBundleNameDir.replace(/\./g, '/');
    fs.unlinkSync(dir);
    logger.green('Done removing previous bundle directory.');
  } else {
    logger.yellow('Bundle directory was not changed. Keeping...');
  }
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
