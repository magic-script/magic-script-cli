#!/usr/bin/env node
// Copyright Magic Leap Inc. 2019
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
'use strict';

require('yargs') // eslint-disable-line
  .command('init [folderName] [packageName] [visibleName]', 'Create a new project', yargs => {
    yargs.positional('folderName', {
      describe: 'Local folder to create project in.',
      type: 'string'
    });
    yargs.positional('packageName', {
      describe: 'The package identifier.',
      type: 'string'
    });
    yargs.positional('visibleName', {
      describe: 'The visible name of the project (optional)',
      type: 'string'
    });
    yargs.option('immersive', {
      alias: 'i',
      describe: 'Generate Immersive app Template',
      boolean: true,
      default: false
    });
  }, argv => require('../commands/init')(argv))
  .command('install [target] [path]', 'Install the project', yargs => {
    yargs.positional('path', {
      describe: 'Path to the mpk',
      default: '.out/app/app.mpk'
    });
    yargs.positional('target', {
      describe: 'target(s) to build for',
      default: 'lumin'
    });
  }, argv => require('../commands/install')(argv))
  .command('build [target]', 'Compile project', yargs => {
    yargs.option('debug', {
      alias: 'd',
      boolean: true,
      default: true
    });
    yargs.option('install', {
      alias: 'i',
      boolean: true,
      default: false
    });
    yargs.positional('target', {
      describe: 'target(s) to build for',
      default: 'lumin'
    });
  }, argv => require('../commands/build')(argv))
  .command('remove', 'Remove project from device', argv => require('../commands/remove')(argv.argv))
  .command('run [target]', 'Compile and run project', yargs => {
    yargs.option('debug', {
      alias: 'd',
      boolean: true,
      default: true
    });
    yargs.option('port', {
      alias: 'p',
      default: 0
    });
    yargs.positional('target', {
      describe: 'target(s) to build for',
      default: 'lumin'
    });
  }, argv => require('../commands/run')(argv))
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .wrap(null)
  .demandCommand().recommendCommands().strict()
  .showHelpOnFail(true)
  .help()
  .argv;
