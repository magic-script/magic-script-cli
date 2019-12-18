// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let fs = require('fs');
let glob = require('glob');
let { exec, execFile, execSync, spawnSync } = require('child_process');
const path = require('path');

module.exports.findPackageName = function () {
  let manifestPath = 'manifest.xml';
  var packageName = '';
  if (!fs.existsSync(manifestPath)) {
    console.error("manifest.xml doesn't exist in current directory");
  } else {
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    if (manifest) {
      let match = manifest.match(/ml:package="([^"]+)"/);
      if (match) { packageName = match[1]; }
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
    if (typeof(output) == 'string') {
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
    this.isInstalled(packageName, (installed) => {
      let installCommand = `mldb install ${installed ? '-u' : ''} ${argv.path}`;
      console.log(installCommand);
      exec(installCommand, (err, stdout, stderr) => {
        if (err) {
          process.stdout.write(stdout);
          process.stderr.write(stderr);
          throw err;
        }
        console.log(stdout);
      });
    });
  }
};

module.exports.isValidPackageId = function (packageId) {
  let regex = /^[a-z0-9_]+(\.[a-z0-9_]+)*(-[a-zA-Z0-9]*)?$/i;
  return packageId && regex.test(packageId);
};

module.exports.isValidFolderName = function (folderName) {
  let regex = /^([A-Za-z\-\_\d])+$/;
  return folderName && regex.test(folderName);
};

module.exports.isValidAppType = function (appType) {
  let regex = /^([A-Za-z\-\_\d])+$/;
  return appType && regex.test(appType);
};

module.exports.createAndroidLocalProperties = function (path) {
  if (!fs.existsSync(`${path}/reactnative/android/local.properties`)) {
    let androidHome = process.env.ANDROID_HOME;
    if (androidHome) {
      let sdkDir = 'sdk.dir=' + androidHome;
      fs.writeFile(`${path}/reactnative/android/local.properties`, sdkDir, function (error) {
        console.error(error);
      });
      console.log('Successfully created local.properties file!');
    } else {
      console.log(
        "Android SDK environment variable doesn't exist. Follow instructions to fix the problem: https://github.com/magic-script/magic-script-template/blob/master/README.md#Android",
      );
    }
  } else {
    console.log('The local.properties file already exists!');
  }
};

module.exports.navigateIfComponents = function (callback) {
  const path = process.cwd();
  if (fs.existsSync(`${path}/lumin`)) {
    process.chdir('lumin');
    callback();
  } else {
    callback();
  }
};

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

module.exports.renameComponentsFiles = renameComponentsFiles;

function renameComponentsFiles (projectName, packageName) {
  let projectPath = process.cwd();
  if (!projectName && !packageName) {
    console.error('You have to specify at least the project name or the package name!');
  } else {
    let manifestPath = `${projectPath}/${projectName}/lumin/manifest.xml`;
    if (fs.existsSync(`${projectPath}/${projectName}/lumin`)) {
      let manifest = fs.readFileSync(manifestPath, 'utf8');
      if (manifest) {
        var result = '';
        if (projectName && packageName) {
          console.log(`new project name: ${projectName}`);
          result = manifest.replace(
            /ml:visible_name="([^"]+)"/g,
            `ml:visible_name="${projectName}"`
          );
          result = result.replace(
            /ml:package="([^"]+)"/g,
            `ml:package="${packageName}"`
          );
        } else if (projectName) {
          console.log(`new project name: ${projectName}`);
          result = manifest.replace(
            /ml:visible_name="([^"]+)"/g,
            `ml:visible_name="${projectName}"`
          );
        } else if (packageName) {
          console.log(`new package name: ${packageName}`);
          result = manifest.replace(
            /ml:package="([^"]+)"/g,
            `ml:package="${packageName}"`
          );
        }
        if (result) {
          fs.writeFileSync(manifestPath, result, 'utf8');
          console.log('Lumin manifest file has been updated successfully');
        }
      }
    }
    var renamingToolPath = path.join(__dirname, '..', 'node_modules/react-native-rename/lib/index.js');
    var reactNativeProjectPath = `${process.cwd()}/${projectName}/reactnative`;
    var pbxprojPath = `${reactNativeProjectPath}/ios/${projectName}.xcodeproj/project.pbxproj`;
    var newpbxprojPath = `${reactNativeProjectPath}/ios/${projectName}.xcodeproj/projectt.pbxproj`;
    if (fs.existsSync(reactNativeProjectPath)) {
      spawnSync(`${renamingToolPath}`, [`${projectName}`, '-b', `${packageName}`], {
        stdio: [process.stdin, process.stdout, process.stderr],
        cwd: `${reactNativeProjectPath}`
      });
      fs.renameSync(`${reactNativeProjectPath}/ios/Template-Bridging-Header.h`, `${reactNativeProjectPath}/ios/${projectName}-Bridging-Header.h`);
      if (fs.existsSync(pbxprojPath)) {
        let content = fs.readFileSync(pbxprojPath, 'utf8');
        content.replace('com.magicscript.template', `${packageName}`);
        fs.writeFileSync(newpbxprojPath, content, 'utf8');
      }
    } else {
      console.log(`Renaming of the project could not be processed because the path does not exist!!`);
    }
  }
};
