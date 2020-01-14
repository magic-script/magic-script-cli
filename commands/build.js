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
    proc.on('message', function (message) {
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
    process.chdir('lumin/');
    buildLumin(
      argv,
      "#!/system/bin/script/mxs\nimport './lumin/src/main.js';\n"
    );
  }
}

function buildLumin (argv, indexContent) {
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

  var buildCommand = `mabu -t ${argv.host ? 'host' : 'device'} ${packagePath}`;

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
    exec(buildCommand, (err, stdout, stderr) => {
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
    });
  });
}

module.exports = argv => {
  npmInstallIfNeeded(`${process.cwd()}`, () => {
    if (argv.target === 'lumin') {
      if (isMultiplatformStructure()) {
        npmInstallIfNeeded(`${process.cwd()}/lumin`, () => {
          buildLuminComponents(argv);
        });
      } else {
        buildLumin(argv, "#!/system/bin/script/mxs\nimport './src/main.js';\n");
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
  });
};

function isMultiplatformStructure () {
  let path = process.cwd();
  return fs.existsSync(`${path}/lumin/rollup.config.js`);
}

function buildAndroid () {
  var path = process.cwd();
  if (fs.existsSync(`${path}/reactnative/android`)) {
    fs.chmodSync(`${path}/reactnative/android/gradlew`, '755');
    var runProcess = spawn('react-native', ['run-android'], {
      stdio: 'inherit',
      cwd: `${path}/reactnative`,
      shell: process.platform === 'win32'
    });
    runProcess.on('message', message => {
      console.log(message);
    });
    runProcess.on('error', function (err) {
      throw err;
    });
    runProcess.on('exit', function (code, signal) {
      if (signal !== null) {
        throw Error(`react-native run-android failed with signal: ${signal}`);
      }
      if (code !== 0) {
        throw Error(`react-native run-android failed with code: ${code}`);
      }
    });
  } else {
    console.error(
      "Cannot build the app for Android because the project wasn't set up to support this platform!"
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
      "Cannot build the app for iOS because the project project wasn't set up to support this platform!"
    );
  }
}

function installPods (path, onInstallFinish) {
  console.log('start installing pods');

  var podProcess = spawn('pod', ['install'], {
    stdio: 'inherit',
    cwd: `${path}/reactnative/ios`,
    shell: process.platform === 'win32'
  });
  podProcess.on('message', function (message) {
    console.log(message);
  });
  podProcess.on('error', function (err) {
    throw err;
  });
  podProcess.on('exit', function (code, signal) {
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
  var runProcess = spawn('react-native', ['run-ios'], {
    stdio: 'inherit',
    cwd: `${process.cwd()}/reactnative`,
    shell: process.platform === 'win32'
  });
  runProcess.on('message', message => {
    console.log(message);
  });
  runProcess.on('error', function (err) {
    throw err;
  });
  runProcess.on('exit', function (code, signal) {
    if (signal !== null) {
      throw Error(`react-native run-ios failed with signal: ${signal}`);
    }
    if (code !== 0) {
      throw Error(`react-native run-ios failed with code: ${code}`);
    }
  });
}
