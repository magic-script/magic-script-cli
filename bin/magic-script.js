#!/usr/bin/env node
// Copyright Magic Leap Inc. 2019
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
'use strict';

require('yargs').usage('\n\n! Usage: Type magic-script <command> --help for detailed help !\n\n') // eslint-disable-line
  .command('init [folderName] [packageName] [appType] [target] [visibleName]', 'Create a new project', yargs => {
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
    yargs.positional('isComponents', {
      describe: 'Choose if the app should be the Components app or the Vanilla MagicScript app',
      boolean: true
    });
    yargs.positional('appType', {
      describe: 'The type of the app. Can be either Landscape, Immersive or Components',
      type: 'string'
    });
    yargs.option('target', {
      alias: 't',
      describe: 'Target platforms for Components app type. Can be a combination of iOS, Android and Lumin',
      default: ['Lumin'],
      type: 'array'
    });
    yargs.option('immersive', {
      alias: 'i',
      describe: 'Generate Immersive app Template',
      boolean: true,
      default: false
    });
    yargs.option('typeScript', {
      describe: 'Should create typescript app',
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
      describe: 'build debug version of the app',
      boolean: true,
      default: true
    });
    yargs.option('install', {
      alias: 'i',
      describe: 'install on the device after build',
      boolean: true,
      default: false
    });
    yargs.option('host', {
      alias: 'h',
      describe: 'host to build on',
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
    yargs.positional('target', {
      describe: 'target(s) to build for',
      default: 'lumin'
    });
    yargs.option('debug', {
      alias: 'd',
      description: 'run in debug mode',
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
