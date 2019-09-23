#!/usr/bin/env node

const argv = require('yargs') // eslint-disable-line
  .command(
    'rename [projectName] [packageName]',
    'Update the project name',
    yargs => {
      yargs.positional('projectName', {
        describe: 'The name of the project',
        type: 'string'
      });
      yargs.option('packageName', {
        describe: 'The package identifier. (optional)',
        type: 'string'
      });
    }
  )
  .help().argv;

var fs = require('fs');
var exec = require('child_process').exec;

let manifestPath = 'manifest.xml';
if (!fs.existsSync(manifestPath)) {
  console.error("manifest.xml doesn't exist in current directory");
} else {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (manifest) {
    var result = '';
    if (argv.projectName) {
      console.log(`project name: ${argv.projectName}`);
      result = manifest.replace(
        /ml:visible_name="([^"]+)"/g,
        `ml:visible_name="${argv.projectName}"`
      );
    }
    if (argv.packageName) {
      console.log(`package name: ${argv.packageName}`);
      result = result.replace(
        /ml:package="([^"]+)"/g,
        `ml:package="${argv.packageName}"`
      );
    }
    if (result) {
      fs.writeFile(manifestPath, result, 'utf8', function (err) {
        if (err) console.log(err);
      });
    }
  }
}
var replaceRNCommand = `./node_modules/react-native-rename/lib/index.js ${argv.projectName}`;
if (argv.packageName) {
  replaceRNCommand = replaceRNCommand + ` -b ${argv.packageName}`;
}
exec(replaceRNCommand, (err, stdout, stderr) => {
  if (err) {
    console.error('Error:', err);
  }
  console.log(stdout);
});
