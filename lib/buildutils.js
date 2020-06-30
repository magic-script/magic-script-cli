// Copyright (c) 2020 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const fs = require('fs');
const { exec, spawn } = require('child_process');
const util = require('../lib/util');
const logger = require('../lib/logger');

module.exports.isTargetSpecified = function (argv) {
  return (
    argv !== null &&
    argv.target !== null &&
    (argv.target === 'lumin' ||
      argv.target === 'android' ||
      argv.target === 'ios')
  );
};

module.exports.npmInstallIfNeeded = function (path, callback) {
  if (fs.existsSync(`${path}/node_modules`)) {
    callback();
  } else {
    logger.normal('npm install: installing');

    const proc = spawn('npm', ['install'], {
      cwd: `${path}`,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    createEmitter('npm install', proc, () => {
      logger.green('npm install: success');
      callback();
    });
  }
};

function createEmitter (command, proc, successCallback) {
  proc.on('message', function (message) {
    logger.normal(message);
  });
  proc.on('error', function (err) {
    throw err;
  });
  proc.on('exit', function (code, signal) {
    if (signal && signal !== null) {
      throw Error(`${command} failed with signal: ${signal}`);
    }
    if (code && code !== 0) {
      throw Error(`${command} failed with code: ${code}`);
    }
    if (successCallback) {
      successCallback();
    }
  });
}

module.exports.isMultiplatformStructure = function () {
  let path = process.cwd();
  return fs.existsSync(`${path}/lumin/rollup.config.js`);
};

module.exports.isReactNativeTarget = function (argv) {
  return argv.target === 'android' || argv.target === 'ios';
}

module.exports.buildAndroid = function () {
  var path = process.cwd();
  if (fs.existsSync(`${path}/reactnative/android`)) {
    fs.chmodSync(`${path}/reactnative/android/gradlew`, '755');
    const runProcess = spawn('npx', ['react-native', 'run-android'], {
      stdio: 'inherit',
      cwd: `${path}/reactnative`,
      shell: process.platform === 'win32'
    });
    createEmitter('npx react-native run-android', runProcess, null);
  } else {
    logger.red(
      "Cannot build the app for Android because the project wasn't set up to support this platform!"
    );
  }
};

module.exports.buildiOS = function () {
  var path = process.cwd();
  if (fs.existsSync(`${path}/reactnative/ios`)) {
    this.installPods(path, () => {
      this.runiOS();
    });
  } else {
    logger.red(
      "Cannot build the app for iOS because the project project wasn't set up to support this platform!"
    );
  }
};

module.exports.installPods = function (path, onInstallFinish) {
  logger.normal('start installing pods');

  var podProcess = spawn('pod', ['install'], {
    stdio: 'inherit',
    cwd: `${path}/reactnative/ios`,
    shell: process.platform === 'win32',
  });
  createEmitter('pod install', podProcess, () => {
    logger.green('pod install: success');
    onInstallFinish();
  });
};

module.exports.runiOS = function () {
  logger.green('run ios app');
  var runProcess = spawn('npx', ['react-native', 'run-ios'], {
    stdio: 'inherit',
    cwd: `${process.cwd()}/reactnative`,
    shell: process.platform === 'win32'
  });
  createEmitter('npx react-native run-ios', runProcess, null);
};

module.exports.navigateToLuminDirectory = function () {
  let path = process.cwd();
  if (fs.existsSync(`${path}/lumin`)) {
    process.chdir('lumin/');
  }
};

module.exports.buildLumin = function (argv, indexContent) {
  let packagePath = 'app.package';
  try {
    for (let name of fs.readdirSync('.')) {
      let m = name.match(/([^/]+)\.package$/);
      if (!m) continue;
      let [, base] = m;
      packagePath = `${base}.package`;
    }
  } catch (err) {
    throw err;
  }

  var device = argv.debug !== false ? 'device' : 'release_device';
  var buildCommand = `mabu -t ${argv.host ? 'host' : device} ${packagePath}`;

  // create bin/index.js if needed
  try {
    fs.mkdirSync('bin');
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  fs.writeFileSync('bin/index.js', indexContent, { mode: 0o755 });

  exec('npm run build', (err, stdout, stderr) => {
    if (err) {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
      throw err;
    }
    util.createDigest(argv.debug);
    if (argv.host && fs.existsSync('app.package')) {
      let packageFile = fs.openSync('app.package', 'a+');
      let buffer = fs.readFileSync(packageFile, 'utf8');
      if (buffer && !buffer.includes('USES = mxs_lumin_runtime')) {
        fs.appendFileSync(packageFile, '\nUSES = mxs_lumin_runtime\n');
      }
    }
    exec(buildCommand, (err, stdout, stderr) => {
      if (err) {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        throw err;
      }

      let mpkFile;
      let outLines = stdout.split('\n');

      let theLine = outLines.find((line) => line.includes('mpk'));
      if (theLine !== undefined) {
        mpkFile = theLine.substring(
          theLine.indexOf("'") + 1,
          theLine.lastIndexOf("'")
        );
        console.log('built package: ' + mpkFile);
      } else {
        theLine = outLines.find((line) => line.includes('output in'));
        console.log(
          theLine.substring(theLine.indexOf("'"), theLine.lastIndexOf("'") + 1)
        );
      }

      if (argv.install) {
        argv.path = mpkFile;
        util.installPackage(argv);
      }
    });
  });
};
