const { exec } = require("child_process");
const util = require("util");

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
