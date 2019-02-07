#!/usr/bin/env node
"use strict";

require('yargs') // eslint-disable-line
  .command("setup", "Setup the MagicLeap SDK", argv => require("../commands/setup")(argv.argv))
  .command("init <projectName> <packageName> [visibleName]", "Create a new project", yargs => {
    yargs.positional("projectName", {
      describe: "Local folder to create project in.",
      type: "string"
    });
    yargs.positional("packageName", {
      describe: "The package identifier.",
      type: "string"
    });
    yargs.positional("visibleName", {
      describe: "The visible name of the project (optional)",
      type: "string"
    });
    yargs.option("immersive", {
      alias: "i",
      describe: "Generate Immersive app Template",
      boolean: true,
      default: false
    });
  }, argv => require("../commands/init")(argv))
  .command("build", "Compile project", yargs => {
    yargs.option("install", {
      alias: "i",
      boolean: true,
      default: false
    });
    yargs.option("debug", {
      alias: "d",
      boolean: true,
      default: true
    });
  }, argv => require("../commands/build")(argv))
  .command("remove", "Remove project from device", argv => require("../commands/remove")(argv.argv))
  .command("run", "Compile and run project", yargs => {
    yargs.option("debug", {
      alias: "d",
      boolean: true,
      default: true
    });
  }, argv => require("../commands/run")(argv))
  .option("verbose", {
    alias: "v",
    default: false
  })
  .demandCommand()
  .help()
  .argv;
