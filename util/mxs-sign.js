#!/usr/bin/env node
// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
'use strict';

const yargs = require('yargs');
let signUtil = require('./mxs-sign-util.js');
/// ///////////////////////////////////////////////////////////////////////////
// User options

const argv = yargs
  .usage('Usage: $0 [<options>] [--] [<modules>]')
  .strict()
  .option('c', {
    alias: 'check',
    describe: 'Check the SHA2-512 sums from the digest file',
    type: 'boolean'
  })
  .option('trace', {
    describe: 'Run in trace mode',
    type: 'boolean'
  })
  .option('debug', {
    describe: 'Add debugging tail data',
    type: 'boolean'
  })
  .alias('h', 'help')
  .alias('v', 'version')
  .help().argv;

/// ///////////////////////////////////////////////////////////////////////////
// Main
signUtil.command = argv.$0;
signUtil.displayTrace = !!argv.trace;
try {
  if (argv.check) {
    if (argv._.length) {
      signUtil.warn('checking the digest file; ignoring the paths in the command line');
    }
    
    signUtil.trace('checking digest file: ' + signUtil.DIGEST_PATH);
    signUtil.checkUnsignedDigest();
    // TODO: Check signature.
  } else {
    if (!argv._.length) {
      // FIXME: Use argv.showHelp(); why does it not work?
      signUtil.die(`no modules for digesting; type '${argv.$0} --help'`);
    }
    signUtil.checkModulePaths(argv._);
    signUtil.trace('creating digest file: ' + signUtil.DIGEST_PATH);
    signUtil.createUnsignedDigest(argv._);
    signUtil.signDigest(argv.debug);
  }
  signUtil.trace('done!');
} catch (err) {
  signUtil.die(err);
}
