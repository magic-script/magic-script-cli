// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under MIT License. See LICENSE file in the project root for full license information.
const { exec } = require("child_process");
const util = require("../lib/util");

module.exports = argv => {
  let packageName = util.findPackageName();
  let removeCommand = "mldb uninstall " + packageName;
  console.log(removeCommand);
  exec(removeCommand, (err, stdout, stderr) => {
    if (err) {
      console.error("Error:", err);
    }
    console.log(stdout);
  });
};
