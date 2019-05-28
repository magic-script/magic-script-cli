// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const util = require('../lib/util');
const { exec } = require('child_process');

module.exports = argv => {
  let packageName = util.findPackageName();
  util.isInstalled(packageName, (installed) => {
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
};
