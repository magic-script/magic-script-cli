import fs from 'fs';
import logger from '../logger';
import path from 'path';

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
      this.copyFiles(origFilePath, newDestPath);
    }
  });
};

module.exports.copyFileOrDir = function (element, destPath) {
  const stats = fs.statSync(element);
  if (stats.isFile()) {
    var contents = fs.readFileSync(element, 'utf8');
    fs.writeFileSync(destPath, contents, 'utf8');
  } else if (stats.isDirectory()) {
    this.copyFiles(element, destPath);
  }
};

module.exports.deletePreviousBundleDirectory = ({ oldBundleNameDir, shouldDelete }) => {
  if (shouldDelete) {
    const dir = oldBundleNameDir.replace(/\./g, '/');
    const deleteDirectory = fs.unlinkSync(dir);
    Promise.resolve(deleteDirectory);
    logger.green('Done removing previous bundle directory.');
  } else {
    Promise.resolve();
    console.yellow('Bundle directory was not changed. Keeping...');
  }
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
  this.replace({
    regex,
    replacement,
    paths,
    ...replaceOptions,
  });

  for (const filePath of paths) {
    logger.green(`${filePath.replace(__dirname, '')} MODIFIED`);
  }
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
          console.log(`Delete files, is directory, ${curPath}`);
          this.deleteFiles(curPath);
        } else {
          console.log(`Delete files, is file, ${curPath}`);
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }
};

module.exports.cleanBuilds = () => {
  Promise.resolve(this.deleteFilesPromise(__dirname, ['ios/build/*', 'android/.gradle/*', 'android/app/build/*', 'android/build/*']));
  logger.green('Done removing builds.');
};

module.exports.deleteFilesPromise = (dir, Files = []) => {
  let promises = Files.map(filename => {
    return new Promise((resolve, reject) => {
      fs.unlink(path.join(dir, filename), err => {
        err ? reject(err) : resolve();
      });
    });
  });
  return Promise.all(promises);
};
