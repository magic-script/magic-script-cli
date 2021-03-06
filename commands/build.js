// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
const buildUtil = require('../lib/buildutils');
const logger = require('../lib/logger');
const multiplatformIndexContent = "#!/system/bin/script/mxs\nimport './lumin/src/main.js';\n";
const vanillaIndexContent = "#!/system/bin/script/mxs\nimport './src/main.js';\n";

module.exports = (argv) => {
  if (buildUtil.isTargetSpecified(argv)) {
    buildUtil.npmInstallIfNeeded(`${process.cwd()}`, () => {
      if (argv.target === 'lumin') {
        if (buildUtil.isMultiplatformStructure()) {
          buildUtil.npmInstallIfNeeded(`${process.cwd()}/lumin`, () => {
            buildUtil.navigateToLuminDirectory();
            buildUtil.buildLumin(argv, multiplatformIndexContent);
          });
        } else {
          buildUtil.buildLumin(argv, vanillaIndexContent);
        }
      } else if (buildUtil.isReactNativeTarget(argv)) {
        buildUtil.npmInstallIfNeeded(`${process.cwd()}/reactnative`, () => {
          if (argv.target === 'android') {
            buildUtil.buildAndroid(argv);
          } else if (argv.target === 'ios') {
            buildUtil.buildiOS(argv);
          }
        });
      }
    });
  } else {
    logger.red('The target must be either lumin, ios or android!');
  }
};
