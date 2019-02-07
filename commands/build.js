const { exec } = require("child_process");
const fs = require("fs");
const util = require("../lib/util");

function npmInstallIfNeeded(callback) {
  if (fs.existsSync("node_modules")) {
    callback();
  } else {
    exec("npm install", (err, stdout, stderr) => {
      if (err) {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        console.error("Error running npm install");
        return;
      }
      console.log("npm install: success");
      callback();
    });
  }
}

module.exports = argv => {
  npmInstallIfNeeded(() => {
    var buildCommand = "mabu -t device app.package";
    exec("npm run build", (err, stdout, stderr) => {
      if (err) {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        console.error("Error:", err);
        return;
      }
      util.createDigest(argv.debug);
      exec(buildCommand, (err, stdout, stderr) => {
        if (err) {
          process.stdout.write(stdout);
          process.stderr.write(stderr);
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
  
          let packageName = util.findPackageName();
          util.isInstalled(packageName, (installed) => {
            let installCommand = `mldb install ${installed ? "-u" : ""} ${mpkFile}`;
            console.log(installCommand);
            exec(installCommand, (err, stdout, stderr) => {
              if (err) {
                process.stdout.write(stdout);
                process.stderr.write(stderr);
                console.error("Error:", err);
              }
              console.log(stdout);
            });
          });
        }
      });
    });
  });
};
