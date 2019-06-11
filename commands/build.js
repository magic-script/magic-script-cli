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
    const proc = spawn('npm', ['install'], { stdio: 'inherit', shell: process.platform === 'win32' });
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
  fs.writeFileSync('bin/index.js', "#!/system/bin/script/mxs\nimport './src/main.js';\n", { mode: 0o755 });

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
          mpkFile = line.substring(line.indexOf("'") + 1, line.lastIndexOf("'"));
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
  npmInstallIfNeeded(() => {
    if (argv.target === 'lumin') {
      buildLumin(argv);
    }
  });
};
