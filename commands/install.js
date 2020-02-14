// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const util = require('../lib/util');
const fs = require('fs');

module.exports = argv => {
  util.navigateIfComponents();
  let mpkPath = util.findMPKPath();
  if (mpkPath && mpkPath !== '') {
    argv.path = mpkPath;
  }
  if (fs.existsSync(argv.path)) {
    util.installPackage(argv);
  } else {
    console.log(`MPK doesn't exist at ${argv.path}, please build it and try again.`);
  }
};
