// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
let { exec, spawn } = require('child_process');
let util = require('../lib/util');
let hash = require('hash-index');

let packageName;
let debug;
let port;

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
  exec(launchCommand, (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      callback(null);
      return;
    }
    if (stdout.includes('Success')) {
      function cb (result) {
        callback(result);
      }
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

function launchCallback (pid) {
  if (pid == null) {
    console.error('Failed to launch:', packageName);
    return;
  }
  if (!debug) {
    return;
  }
  const mldbCommand = spawn('mldb', ['log']);
  mldbCommand.stdout.on('data', (data) => {
    if (data.includes(pid) && data.includes('chrome')) {
      mldbCommand.kill();
      let dataString = `${data}`;
      let pattern = /chrome.+:(\d{3,5})/;
      let matches = dataString.match(pattern);
      if (matches.length > 1) {
        let port = matches[1];
        let forwardCommand = 'mldb forward tcp:' + port + ' tcp:' + port;
        exec(forwardCommand, (err, stdout, stderr) => {
          if (!err && stdout.length == 0 && stderr.length == 0) {
            console.info('Success: port forwarded', port);
            console.log('Please open in chrome:', matches[0]);
          }
        });
      }
    }
  });
  mldbCommand.stderr.on('data', (data) => {
    console.error(`mldbCommand stderr:\n${data}`);
  });
  console.info(packageName, 'launched with PID:', pid);
}

function runLumin (argv) {
  let localArguments = argv._;
  debug = argv.debug;
  port = argv.port;
  if (localArguments.length > 1) {
    packageName = localArguments[1];
  } else {
    packageName = util.findPackageName();
  }
  if (packageName) {
    function installedCallback (installed) {
      if (installed) {
        isRunning(runningCallback);
      } else {
        console.warn(`Package: ${packageName} is not installed.  Please install it.`);
      }
    }
    function runningCallback (pid) {
      if (pid == null) {
        launchFunction(launchCallback);
      } else {
        function launchMe () {
          launchFunction(launchCallback);
        }
        terminateFunction(launchMe);
      }
    }
    util.isInstalled(packageName, installedCallback);
  }
}

module.exports = argv => {
  if (argv.target === 'lumin') {
    util.navigateIfComponents();
    runLumin(argv);
  }
};
