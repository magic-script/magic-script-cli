// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let fs = require('fs');
let glob = require('glob');
let { exec, execFile, execSync } = require('child_process');

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
  } catch (err){
    console.error(`Error starting MLDB server`);
    return false;
  }
  return true;
};

module.exports.createDigest = function (debug) {
  const node = process.argv0;
  const mxsSign = __dirname + '/../util/mxs-sign.js';
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
