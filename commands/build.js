// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const { exec } = require('child_process');
const fs = require('fs');
const util = require('../lib/util');

function npmInstallIfNeeded (callback) {
  if (fs.existsSync('node_modules')) {
    callback();
  } else {
    exec('npm install', (err, stdout, stderr) => {
      if (err) {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        throw err;
      }
      console.log('npm install: success');
      callback();
    });
  }
}

module.exports = argv => {
  npmInstallIfNeeded(() => {
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
      if (error.code != 'EEXIST') {
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
          util.installPackage(argv.path);
        }
      });
    });
  });
};
