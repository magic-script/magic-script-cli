// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let fs = require('fs');
let glob = require('glob');
let { exec, execFile, execSync, spawnSync, spawn } = require('child_process');
const path = require('path');
const rename = require.resolve('react-native-rename');

module.exports.findPackageName = function () {
  let manifestPath = 'manifest.xml';
  var packageName = '';
  if (!fs.existsSync(manifestPath)) {
    console.error("manifest.xml doesn't exist in current directory");
  } else {
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    if (manifest) {
      let match = manifest.match(/ml:package="([^"]+)"/);
      if (match) {
        packageName = match[1];
      }
    }
  }
  return packageName;
};

module.exports.isInstalled = function (packageName, callback) {
  this.startMLDB();
  exec('mldb packages -j', (err, stdout, stderr) => {
    if (err) {
      throw err;
    }
    let packagesJSON = JSON.parse(stdout);
    if (packagesJSON) {
      var found = false;
      for (let packageObj of packagesJSON) {
        if (packageObj['package'] === packageName) {
          found = true;
          break;
        }
      }
      if (found) {
        callback(true);
        return;
      }
    } else {
      console.error('Failed to parse packages JSON');
    }
    callback(false);
  });
};

module.exports.startMLDB = function () {
  var output = execSync('mldb start-server');
  if (typeof output == 'string') {
    console.log(output);
  } else {
    console.log(output.toString('utf8'));
  }
};

module.exports.createDigest = function (debug) {
  const node = process.argv0;
  const mxsSign = path.join(__dirname, '..', '/util/mxs-sign.js');
  if (!fs.existsSync(mxsSign)) {
    console.error('Signing Script not available');
    return;
  }
  let command = [mxsSign].concat(glob.sync('bin/**/*.js'));
  command.push('--debug=' + debug);
  execFile(node, command, (err, stdout, stderr) => {
    if (err) {
      console.error('error getting installed packages:', err);
      return;
    }
    console.log(stdout);
  });
};

module.exports.installPackage = function (argv) {
  if (argv.target === 'lumin') {
    let packageName = this.findPackageName();
    navigateIfComponents();
    this.isInstalled(packageName, installed => {
      var args = ['install'];
      if (installed) {
        args.push('-u');
      }
      args.push(argv.path);
      console.log(`mldb ${args.join(' ')}`);
      var child = spawn('mldb', args, {
        shell: process.platform === 'win32'
      });
      if (child) {
        child.stdout.on('data', data => {
          process.stdout.write(data);
        });
        child.stderr.on('data', data => {
          process.stderr.write(data);
        });
        child.on('error', err => {
          throw err;
        });
      }
    });
  }
};

module.exports.PackageIdRegex = /^(?=.{3,30}$)(?=.*[.])[a-zA-Z0-9]+(?:[.][a-zA-Z0-9]+)*$/;
module.exports.FolderNameRegex = /^(?:[A-Za-z\-_\d])+$|^\.$/;
module.exports.AppNameRegex = /^(?=.{3,30}$)[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/;

module.exports.isValidPackageId = function (packageId) {
  return module.exports.PackageIdRegex.test(packageId);
};

module.exports.isValidFolderName = function (folderName) {
  return module.exports.FolderNameRegex.test(folderName);
};

module.exports.isValidAppName = function (appName) {
  return module.exports.AppNameRegex.test(appName);
};

module.exports.validatePackageId = function (packageId) {
  if (!module.exports.isValidPackageId(packageId)) {
    return (
      'Invalid package ID. Must match ' +
      module.exports.PackageIdRegex.toString()
    );
  }
  return true;
};

module.exports.validateFolderName = function (folderName) {
  if (!module.exports.isValidFolderName(folderName)) {
    return (
      'Invalid folder name. Must match ' +
      module.exports.FolderNameRegex.toString()
    );
  }
  return true;
};

module.exports.validateAppName = function (appName) {
  if (!module.exports.isValidAppName(appName)) {
    return (
      'Invalid app name. Must match ' +
      module.exports.AppNameRegex.toString()
    );
  }
  return true;
};

module.exports.isValidAppType = function (appType) {
  let regex = /^([A-Za-z\-\_\d])+$/;
  return appType && regex.test(appType);
};

module.exports.navigateIfComponents = navigateIfComponents;

function navigateIfComponents () {
  const path = process.cwd();
  if (fs.existsSync(`${path}/lumin`)) {
    process.chdir('lumin');
  }
}

module.exports.removeFilesRecursively = removeFilesRecursively;

function removeFilesRecursively (path) {
  const filesToDelete = fs.readdirSync(path);
  filesToDelete.forEach(file => {
    const curPath = `${path}/${file}`;
    if (fs.lstatSync(curPath).isDirectory()) {
      removeFilesRecursively(curPath);
    } else {
      fs.unlinkSync(curPath);
    }
  });
  fs.rmdirSync(path);
}

module.exports.findMPKPath = function () {
  let packagePath = 'app.package';
  var mpkName = '';
  if (!fs.existsSync(packagePath)) {
    console.error('Cannot file: app.package');
  } else {
    var output = '' + execSync('mabu -t device --print-package-outputs app.package');
    let tokenized = output.split('\t');
    if (tokenized && tokenized.length > 1) {
      mpkName = tokenized[1].trim();
    }
  }
  return mpkName;
};
