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
  if (this.startMLDB()) {
    exec('mldb packages -j', (err, stdout, stderr) => {
      if (err) {
        console.error('error getting installed packages:', err);
        callback(false);
        return;
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
  }
};

module.exports.startMLDB = function () {
  try {
    var output = execSync('mldb start-server');
    if (typeof output == 'string') {
      console.log(output);
    } else {
      console.log(output.toString('utf8'));
    }
  } catch (err) {
    console.error(`Error starting MLDB server`);
    return false;
  }
  return true;
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
    navigateIfComponents(() => {
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
    });
  }
};

module.exports.PackageIdRegex = /^[a-z0-9_]+(\.[a-z0-9_]+)*(-[a-zA-Z0-9]*)?$/;
module.exports.FolderNameRegex = /^([A-Za-z\-_\d])+$/;

module.exports.isValidPackageId = function (packageId) {
  return module.exports.PackageIdRegex.test(packageId);
};

module.exports.isValidFolderName = function (folderName) {
  return module.exports.FolderNameRegex.test(folderName);
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

module.exports.isValidAppType = function (appType) {
  let regex = /^([A-Za-z\-\_\d])+$/;
  return appType && regex.test(appType);
};

module.exports.createAndroidLocalProperties = function (projPath) {
  if (!fs.existsSync(`${projPath}/reactnative/android/local.properties`)) {
    let androidHome = process.env.ANDROID_HOME;
    if (androidHome) {
      if (process.platform === 'win32') {
        androidHome = androidHome.replace(/\\/g, '\\\\');
      }
      let sdkDir = 'sdk.dir=' + androidHome;
      fs.writeFile(
        `${projPath}/reactnative/android/local.properties`,
        sdkDir,
        function (error) {
          console.error(error);
        }
      );
      console.log('Successfully created local.properties file!');
    } else {
      console.log(
        "Android SDK environment variable doesn't exist. Follow instructions to fix the problem: https://magicscript.org/"
      );
    }
  } else {
    console.log('The local.properties file already exists!');
  }
};

module.exports.navigateIfComponents = navigateIfComponents;

function navigateIfComponents (callback) {
  const path = process.cwd();
  if (fs.existsSync(`${path}/lumin`)) {
    process.chdir('lumin');
    callback();
  } else {
    callback();
  }
}

module.exports.copyComponentsFiles = copyFiles;

function copyFiles (srcPath, destPath) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }
  const filesToCreate = fs.readdirSync(srcPath);
  filesToCreate.forEach(file => {
    const origFilePath = `${srcPath}/${file}`;
    const stats = fs.statSync(origFilePath);
    if (stats.isFile()) {
      var contents = fs.readFileSync(origFilePath);
      const writePath = `${destPath}/${file}`;
      fs.writeFileSync(writePath, contents);
    } else if (stats.isDirectory()) {
      let newDestPath = `${destPath}/${file}`;
      copyFiles(origFilePath, newDestPath);
    }
  });
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

module.exports.renameComponentsFiles = renameComponentsFiles;

function renameComponentsFiles (folderName, packageName, visibleName) {
  let projectPath = process.cwd();
  if (!visibleName) {
    console.error(
      'You have to specify the project name to rename the project!!'
    );
  } else {
    let manifestPath = `${projectPath}/${folderName}/lumin/manifest.xml`;
    if (fs.existsSync(`${projectPath}/${folderName}/lumin`)) {
      let manifest = fs.readFileSync(manifestPath, 'utf8');
      if (manifest) {
        var result = '';
        if (visibleName && packageName) {
          console.log(`new project name: ${visibleName}`);
          result = manifest.replace(
            /ml:visible_name="([^"]+)"/g,
            `ml:visible_name="${visibleName}"`
          );
          result = result.replace(
            /ml:package="([^"]+)"/g,
            `ml:package="${packageName}"`
          );
        } else if (visibleName) {
          console.log(`new project name: ${visibleName}`);
          result = manifest.replace(
            /ml:visible_name="([^"]+)"/g,
            `ml:visible_name="${visibleName}"`
          );
        }
        if (result) {
          fs.writeFileSync(manifestPath, result, 'utf8');
          console.log('Lumin manifest file has been updated successfully');
        }
      }
    }
    var renameCommand = rename;
    if (process.platform === 'win32') {
      renameCommand = `node ${rename}`;
    }
    var reactNativeProjectPath = `${process.cwd()}/${folderName}/reactnative`;
    var pbxprojPath = `${reactNativeProjectPath}/ios/${folderName}.xcodeproj/project.pbxproj`;
    var newpbxprojPath = `${reactNativeProjectPath}/ios/${folderName}.xcodeproj/projectt.pbxproj`;
    if (fs.existsSync(reactNativeProjectPath)) {
      console.log('Prepare project name and package in the project...');
      spawnSync(renameCommand, [`${visibleName}`, '-b', `${packageName}`], {
        cwd: `${reactNativeProjectPath}`,
        shell: process.platform === 'win32'
      });
      fs.renameSync(
        `${reactNativeProjectPath}/ios/Template-Bridging-Header.h`,
        `${reactNativeProjectPath}/ios/${folderName}-Bridging-Header.h`
      );
      if (fs.existsSync(pbxprojPath) && packageName) {
        let content = fs.readFileSync(pbxprojPath, 'utf8');
        content.replace('com.magicscript.template', `${packageName}`);
        fs.writeFileSync(newpbxprojPath, content, 'utf8');
      }
    } else {
      console.log(
        'Renaming of the project could not be processed because the path does not exist!!'
      );
    }
  }
}
