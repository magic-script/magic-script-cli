// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let { exec, spawn } = require('child_process');
let util = require('../lib/util');
let hash = require('hash-index');
let path = require('path');
let fs = require('fs');

let packageName;
let debug;
let port;
let host;

function getPortFromPackageName () {
  return hash(packageName, 65535 - 1024) + 1024;
}

function isRunning (callback) {
  exec('mldb ps', (err, stdout, stderr) => {
    var running = null;
    if (err) {
      console.error(`exec error: ${err}`);
      callback(running);
      return;
    }
    const searcher = /(\d+)\s+\d+.+/g;
    let matches = stdout.match(searcher);
    if (matches) {
      for (var i = 0; i < matches.length; ++i) {
        let match = matches[i];
        if (match.includes(packageName)) {
          var pid = match.substring(0, match.indexOf(' '));
          running = pid;
          break;
        }
      }
    }
    callback(running);
  });
}

function launchFunction (callback) {
  let autoPrivilege = debug ? ' --auto-net-privs' : '';
  let portNumber = port > 0 && port < 65536 ? port : getPortFromPackageName();
  let portArg = '-v INSPECTOR_PORT=' + portNumber;
  let launchCommand = `mldb launch${autoPrivilege} ${portArg} ${packageName}`;
  console.info(`Launching: ${packageName} at port: ${portNumber}`);
  function cb (result) {
    callback(result);
  }
  exec(launchCommand, (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      callback(null);
      return;
    }
    if (stdout.includes('Success')) {
      isRunning(cb);
    }
  });
}

function terminateFunction (callback) {
  let launchCommand = 'mldb terminate ' + packageName;
  console.info('Terminating:', packageName);
  exec(launchCommand, (err, stdout, stderr) => {
    setTimeout(callback, 1000);
  });
}

function callCommand (command, parameters, shouldForward, pid) {
  let spawnCommand = spawn(command, parameters);
  spawnCommand.stdout.on('data', (rawData) => {
    if (rawData !== undefined) {
      let data = `${rawData}`;
      if ((data.includes(pid) || pid === undefined) && data.includes('chrome')) {
        if (shouldForward) {
          spawnCommand.kill();
        }
        let pattern = /chrome.+:(\d{3,5})/;
        let matches = data.match(pattern);
        if (matches && matches.length > 1) {
          let port = matches[1];
          if (shouldForward) {
            let forwardCommand = 'mldb forward tcp:' + port + ' tcp:' + port;
            exec(forwardCommand, (err, stdout, stderr) => {
              if (!err && stdout.length === 0 && stderr.length === 0) {
                console.info('Success: port forwarded', port);
                console.log('Please open in chrome:', matches[0]);
              }
            });
          } else {
            console.log('Please open in chrome:', matches[0]);
          }
        }
      }
    }
  });
  spawnCommand.stderr.on('data', (rawData) => {
    if (rawData !== undefined) {
      let data = `${rawData}`;
      let debugPattern = /chrome.+:(\d{3,5})/;
      let matches = data.match(debugPattern);
      if (matches && matches.length > 1) {
        console.log('Please open in chrome:', matches[0]);
      }
      let pattern = /MagicScript: [debug:|info:].*/g;
      data = data.replace(pattern, '').trim();
      data = data.replace(/(\r\n|\r|\n){2,}/g, '$1\n');
      if (data.length > 0) {
        console.log(data);
      }
    }
  });
}

function launchCallback (pid) {
  if (pid === null) {
    console.error('Failed to launch:', packageName);
    return;
  }
  if (!debug) {
    return;
  }
  callCommand('mldb', ['log'], true, pid);
  console.info(packageName, 'launched with PID:', pid);
}

function runLumin (argv) {
  let localArguments = argv._;
  debug = argv.debug;
  port = argv.port;
  host = argv.host;
  if (host) {
    let mpkPath = util.findMPKPath();
    let hostPath = path.dirname(mpkPath);
    let result = fs.existsSync(hostPath);
    console.log(mpkPath, hostPath, result);
    if (result) {
      process.chdir(hostPath);
    }
    callCommand('mxs', [path.join('bin', 'index.js')], false);
  } else {
    if (localArguments.length > 1) {
      packageName = localArguments[1];
    } else {
      packageName = util.findPackageName();
    }
    if (packageName) {
      util.isInstalled(packageName, (installed) => {
        if (installed) {
          isRunning((pid) => {
            if (pid === null) {
              launchFunction(launchCallback);
            } else {
              terminateFunction(() => {
                launchFunction(launchCallback);
              });
            }
          });
        } else {
          console.warn(`Package: ${packageName} is not installed.  Please install it.`);
        }
      });
    }
  }
}

module.exports = argv => {
  if (argv.target === 'lumin') {
    util.navigateIfComponents();
    runLumin(argv);
  }
};
