// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const { exec, spawn } = require('child_process');
const fs = require('fs');
const util = require('../lib/util');

function npmInstallIfNeeded (callback) {
  if (fs.existsSync('node_modules')) {
    callback();
  } else {
    console.log('npm install: installing');
    const proc = spawn('npm', ['install'], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
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

function buildLumin (argv) {
  let packagePath = 'app.package';
  var path = process.cwd();
  if (fs.existsSync(`${path}/lumin`)) {
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
  } else {
    console.error(
      "Cannot build the app for Lumin because the project doesn't support this platform!"
    );
  }
}

module.exports = argv => {
  npmInstallIfNeeded(() => {
    if (argv.target === 'lumin') {
      buildLumin(argv);
    } else if (argv.target === 'android') {
      buildAndroid(argv);
    } else if (argv.target === 'ios') {
      buildiOS(argv);
    }
  });
};

function buildAndroid (argv) {
  var path = process.cwd();
  var buildCommand = 'react-native run-android';
  if (fs.existsSync(`${path}/android`)) {
    fs.chmodSync(`${path}/android/gradlew`, '755');
    exec(buildCommand, (err, stdout, stderr) => {
      if (err) {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        throw err;
      }
      console.log(stdout);
    });
  } else {
    console.error(
      "Cannot build the app for Android because the project doesn't support this platform!"
    );
  }
}

function buildiOS (argv) {
  var path = process.cwd();
  if (fs.existsSync(`${path}/ios`)) {
    installPods(path, onInstallFinish => {
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
  var podCommand = `cd ${path}/ios && pod install && cd ..`;
  var podProcess = exec(podCommand);
  podProcess.stdout.on('data', data => {
    console.log(data);
  });
  podProcess.on('error', function (err) {
    throw err;
  });
  podProcess.on('exit', function (code, signal) {
    if (signal !== null) {
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
  var runProcess = exec(buildCommand);
  runProcess.stdout.on('data', data => {
    console.log(data);
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
