#!/usr/bin/env node
'use strict'

require('yargs') // eslint-disable-line
  .command('setup', 'Setup the MagicLeap SDK', argv => require('../commands/setup')(argv.argv))
  .command('init <package-name>', 'Create a new project', yargs => {
    yargs.positional('package-name', {
      describe: 'Local folder to create project in.',
      type: 'string'
    })
  }, argv => require('../commands/init')(argv.argv))
  .command('run', 'Compile and run project', argv => require('../commands/run')(argv.argv))
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .demandCommand()
  .help()
  .argv
