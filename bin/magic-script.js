#!/usr/bin/env node
// Copyright Magic Leap Inc. 2019
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
'use strict';

require('yargs') // eslint-disable-line
  .command('init <projectName> <packageName> [visibleName]', 'Create a new project', yargs => {
    yargs.positional('projectName', {
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
  .command('build', 'Compile project', yargs => {
    yargs.option('install', {
      alias: 'i',
      boolean: true,
      default: false
    });
    yargs.option('debug', {
      alias: 'd',
      boolean: true,
      default: true
    });
  }, argv => require('../commands/build')(argv))
  .command('remove', 'Remove project from device', argv => require('../commands/remove')(argv.argv))
  .command('run', 'Compile and run project', yargs => {
    yargs.option('debug', {
      alias: 'd',
      boolean: true,
      default: true
    });
    yargs.option('port', {
      alias: 'p',
      default: 0
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
