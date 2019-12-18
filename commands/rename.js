// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = argv => {
  let projectPath = process.cwd();
  if (!argv.projectName && !argv.packageName) {
    console.error('You have to specify at least the project name or the package name!');
  } else {
    let manifestPath = `${projectPath}/manifest.xml`;
    if (fs.existsSync(`${projectPath}/lumin`)) {
      let manifest = fs.readFileSync(manifestPath, 'utf8');
      if (manifest) {
        var result = '';
        if (argv.projectName && argv.packageName) {
          console.log(`new project name: ${argv.projectName}`);
          result = manifest.replace(
            /ml:visible_name="([^"]+)"/g,
            `ml:visible_name="${argv.projectName}"`
          );
          result = result.replace(
            /ml:package="([^"]+)"/g,
            `ml:package="${argv.packageName}"`
          );
        } else if (argv.projectName) {
          console.log(`new project name: ${argv.projectName}`);
          result = manifest.replace(
            /ml:visible_name="([^"]+)"/g,
            `ml:visible_name="${argv.projectName}"`
          );
        } else if (argv.packageName) {
          console.log(`new package name: ${argv.packageName}`);
          result = manifest.replace(
            /ml:package="([^"]+)"/g,
            `ml:package="${argv.packageName}"`
          );
        }
        if (result) {
          fs.writeFileSync(manifestPath, result, 'utf8');
          console.log('Lumin manifest file has been updated successfully');
        }
      }
    }
    var indexPath = path.join(__dirname, '..', 'node_modules/react-native-rename/lib/index.js');
    var renameRNCommand = `${indexPath} ${argv.projectName}`;
    if (argv.packageName) {
      renameRNCommand = renameRNCommand + ` -b ${argv.packageName}`;
    }
    exec(renameRNCommand, (err, stdout, stderr) => {
      if (err) {
        console.error('Error renaming RN project:', stderr);
      }
      console.log(stdout);
    });
  }
};
