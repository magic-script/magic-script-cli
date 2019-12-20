#!/usr/bin/env node

const fs = require('fs');

if (!fs.existsSync('./local.properties')) {
  let androidHome = process.env.ANDROID_HOME;
  if (androidHome) {
    let sdkDir = 'sdk.dir=' + androidHome;
    fs.writeFile('./local.properties', sdkDir, function (error) {
      console.error(error);
    });
    console.log('Successfully created local.properties file!');
  } else {
    console.log(
      "Android SDK environment variable doesn't exist. Follow instructions to fix the problem: https://github.com/magic-script/magic-script-template/blob/master/README.md#Android",
    );
  }
} else {
  console.log('The local.properties file already exists!');
}
