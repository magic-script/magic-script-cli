const { exec } = require("child_process");
const fs = require("fs");
const util = require("../lib/util");

function getPackageName() {
  var name = "";
  let currentDir = fs.readdirSync(process.cwd());
  for (let file of currentDir) {
    if (file.indexOf(".package") > 0) {
      name = file.substring(0, file.indexOf("."));
      break;
    }
  }
  return name;
}

module.exports = argv => {
  var packageName = getPackageName();
  var buildCommand = `mabu -t device ${packageName}.package`;
  if (argv.certsPath && fs.existsSync(argv.certsPath)) {
    buildCommand = `mabu -s ${argv.certsPath} -t device ${packageName}.package`;
  }
  util.createDigest();
  exec(buildCommand, (err, stdout, stderr) => {
    if (err) {
      console.error("Error:", err);
    }
    let mpkFile;
    let outLines = stdout.split("\n");
    for (let line of outLines) {
      if (line.indexOf("mpk") > 0) {
        mpkFile = line.substring(line.indexOf("'") + 1, line.lastIndexOf("'"));
        break;
      }
    }
    console.log("built package: " + mpkFile);
    if (argv.install) {
      function isInstalledCallback(installed) {
        let installCommand = `mldb install ${installed ? "-u" : ""} ${mpkFile}`;
        console.log(installCommand);
        exec(installCommand, (err, stdout, stderr) => {
          if (err) {
            console.error("Error:", err);
          }
          console.log(stdout);
        });
      }
      let packageName = util.findPackageName();
      util.isInstalled(packageName, isInstalledCallback);
    }
  });
};
