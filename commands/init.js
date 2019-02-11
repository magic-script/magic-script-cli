// Copyright 2019 Magic Leap Inc.
// Distributed under MIT License. See LICENSE file in the project root for full license information.
let process = require("process");
let fs = require("fs");
let templatePath = `${__dirname}/../template`;

var packageName;
var visibleName;
var projectName;
var immersive;

function updateManifest(contents) {
  let replaced = contents
    .replace("com.magicleap.magicscript.hello-sample", packageName)
    .replace(new RegExp("MagicScript Hello Sample", "g"), visibleName);
  if (immersive) {
    replaced = replaced.replace("universe", "fullscreen")
      .replace("Universe", "Fullscreen")
      .replace("<uses-privilege ml:name=\"MagicScript\"/>",
        "<uses-privilege ml:name=\"LowLatencyLightwear\"/>\n    <uses-privilege ml:name=\"MagicScript\"/>");
  }
  return replaced;
}

function copyFiles(srcPath, destPath) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath);
  }
  const filesToCreate = fs.readdirSync(srcPath);
  filesToCreate.forEach(file => {
    const origFilePath = `${srcPath}/${file}`;
    const stats = fs.statSync(origFilePath);
    if (stats.isFile()) {
      var contents = fs.readFileSync(origFilePath, "utf8");
      if (file === "manifest.xml") {
        contents = updateManifest(contents);
      } else if ( immersive && file === "main.js") {
        contents = contents.replace(new RegExp("LandscapeApp", "g"), "ImmersiveApp");
      }
      const writePath = `${destPath}/${file}`;
      fs.writeFileSync(writePath, contents, "utf8");
    } else if (stats.isDirectory()) {
      let newDestPath = `${destPath}/${file}`;
      copyFiles(origFilePath, newDestPath);
    }
  });
}

module.exports = argv => {
  let nameRegex = /^([A-Za-z\-\_\d])+$/;
  let idRegex = /^[a-z0-9_]+(\.[a-z0-9_]+)*(-[a-zA-Z0-9]*)?$/i;
  immersive = argv.immersive;
  if (!nameRegex.test(argv.projectName)) {
    console.error("Invalid project name");
    return -1;
  } else if (!idRegex.test(argv.packageName)) {
    console.error("Bad package name:", argv.packageName);
    return -1;
  }
  packageName = argv.packageName;
  projectName = argv.projectName;
  visibleName = argv.visibleName || projectName;
  console.log("Project Name:", projectName);
  const currentDirectory = process.cwd();
  copyFiles(templatePath, `${currentDirectory}/${projectName}`);
};
