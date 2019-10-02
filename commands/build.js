// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const { exec, spawn } = require('child_process');
const fs = require('fs');
const util = require('../lib/util');

function npmInstallIfNeeded (path, callback) {
  if (fs.existsSync(`${path}/node_modules`)) {
    callback();
  } else {
    console.log('npm install: installing');

    const proc = spawn('npm', ['install'], {
      cwd: `${path}`,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    proc.on('message', function (message, sendhandle) {
      console.log(message);
    });
    proc.on('error', function (err) {
      throw err;
    });
    proc.on('exit', function (code, signal) {
      if (signal !== null) {
        throw Error(`npm install failed with signal: ${signal}`);
      }
      if (code !== 0) {
        throw Error(`npm install failed with code: ${code}`);
      }
      console.log('npm install: success');
      callback();
    });
  }
}

function buildLuminComponents (argv) {
  let path = process.cwd();
  if (fs.existsSync(`${path}/lumin`)) {
    util.copyComponentsFiles(`${path}/src`, `${path}/lumin/src`);
    process.chdir('lumin/');
    buildLumin(argv);
  }
}

function buildLumin (argv) {
  console.log(`BUILD COMMAND dir: ${process.cwd()}`);
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
  var buildCommand = `mabu -t device ${packagePath}`;
  // create bin/index.js if needed
  try {
    fs.mkdirSync('bin');
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  fs.writeFileSync(
    'bin/index.js',
    "#!/system/bin/script/mxs\nimport './src/main.js';\n",
    { mode: 0o755 }
  );

  exec('npm run build', (err, stdout, stderr) => {
    if (err) {
      process.stdout.write(stdout);
      process.stderr.write(stderr);
      throw err;
    }
    util.createDigest(argv.debug);
    exec(buildCommand, (err, stdout, stderr) => {
      console.log(`BUILD COMMAND dir: ${process.cwd()}`);
      if (err) {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        throw err;
      }
      let mpkFile;
      let outLines = stdout.split('\n');
      for (let line of outLines) {
        if (line.indexOf('mpk') > 0) {
          mpkFile = line.substring(
            line.indexOf("'") + 1,
            line.lastIndexOf("'")
          );
          break;
        }
      }
      console.log('built package: ' + mpkFile);
      if (argv.install) {
        argv.path = mpkFile;
        util.installPackage(argv);
      }
      process.chdir('..');
    });
  });
}

module.exports = argv => {
  if (argv.target === 'lumin') {
    if (isComponents()) {
      npmInstallIfNeeded(`${process.cwd()}/lumin`, () => {
        buildLuminComponents(argv);
      });
    } else {
      npmInstallIfNeeded(`${process.cwd()}`, () => {
        buildLumin(argv);
      });
    }
  } else if (argv.target === 'android') {
    npmInstallIfNeeded(`${process.cwd()}/reactnative`, () => {
      buildAndroid(argv);
    });
  } else if (argv.target === 'ios') {
    npmInstallIfNeeded(`${process.cwd()}/reactnative`, () => {
      buildiOS(argv);
    });
  } else {
    console.error('The target must be either lumin, ios or android!');
  }
};

function isComponents () {
  let path = process.cwd();
  return fs.existsSync(`${path}/lumin`);
}

function buildAndroid () {
  var path = process.cwd();
  var buildCommand = 'react-native run-android';
  if (fs.existsSync(`${path}/reactnative/android`)) {
    fs.chmodSync(`${path}/reactnative/android/gradlew`, '755');
    process.chdir('reactnative');
    exec(buildCommand, (err, stdout, stderr) => {
      if (err) {
        process.chdir('..');
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        throw err;
      }
      console.log(stdout);
      process.chdir('..');
    });
  } else {
    console.error(
      "Cannot build the app for Android because the project doesn't support this platform!"
    );
  }
}

function buildiOS () {
  var path = process.cwd();
  if (fs.existsSync(`${path}/reactnative/ios`)) {
    installPods(path, () => {
      runiOS();
    });
  } else {
    console.error(
      "Cannot build the app for iOS because the project doesn't support this platform!"
    );
  }
}

function installPods (path, onInstallFinish) {
  console.log('start installing pods');
  var podCommand = `cd ${path}/reactnative/ios && pod install && cd .. && cd ..`;
  var podProcess = exec(podCommand);
  podProcess.on('message', (message, sendhandle) => {
    console.log(message);
  });
  podProcess.on('error', function (err) {
    throw err;
  });
  podProcess.on('exit', function (code, signal) {
    console.log(`--TEST-- code: ${code}, signal: ${signal}`);
    if (signal) {
      throw Error(`pod install failed with signal: ${signal}`);
    }
    if (code !== 0) {
      throw Error(`pod install failed with code: ${code}`);
    }
    console.log('pod install: success');
    onInstallFinish();
  });
}

function runiOS () {
  console.log('run ios app');
  var buildCommand = 'react-native run-ios';
  process.chdir('reactnative');
  var runProcess = exec(buildCommand);
  runProcess.stdout.on('data', data => {
    console.log(data);
  });
  runProcess.on('error', function (err) {
    process.chdir('..');
    throw err;
  });
  runProcess.on('exit', function (code, signal) {
    process.chdir('..');
    if (signal !== null) {
      throw Error(`react-native run-ios failed with signal: ${signal}`);
    }
    if (code !== 0) {
      throw Error(`react-native run-ios failed with code: ${code}`);
    }
  });
}
