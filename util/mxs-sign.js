#!/usr/bin/env node
// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under MIT License. See LICENSE file in the project root for full license information.
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const which = require('which');
const yargs = require('yargs');
const { execFile, exec } = require('child_process');

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
// Constants

// The digest file path.
const DIGEST_PATH = 'digest.sha512.signed';

// The header (magic number and command) before the digest content.
const DIGEST_MAGIC = '#\u00A1\u007F';
const DIGEST_COMMAND = 'sha512sum -c';
const DIGEST_CONTENT_HEADER = DIGEST_MAGIC + DIGEST_COMMAND + '\n';

// The separator between the digest content and the digital signature.
const DIGEST_CONTENT_SEPARATOR = '#\0';

/// ///////////////////////////////////////////////////////////////////////////
// Functions

// Print the given message to console.error and terminate abnormally.
function die (message) {
  if (typeof message === 'string') {
    console.error('%s: Error: %s', argv.$0, message);
  } else {
    // This is a possibly complex exception; don't make it any fancier.
    console.error('%s: %s', argv.$0, message);
  }
  // Follow the Perl exit code convention.
  process.exit(255);
}

// Print the given message to console.warn.
function warn (message) {
  console.warn('%s: Warning: %s', argv.$0, message);
}

function trace (message) {
  if (argv.trace) {
    console.debug('%s: ... %s', argv.$0, message);
  }
}

// Check the given module paths to ensure that they are relative and normalized.
function checkModulePaths (modulePaths) {
  for (let modulePath of modulePaths) {
    if (path.isAbsolute(modulePath)) {
      throw "can't sign absolute path: " + modulePath;
    }
    if (modulePath.match(/^\.(\.)?\//) || modulePath.match(/\/\.(\.)?\//)) {
      throw "can't sign non-normalized path: " + modulePath;
    }
  }
}

// Create the unsigned digest file from the given module paths.
function createUnsignedDigest (modulePaths) {
  // Open the file descriptor and write the digest content header.
  let fd = fs.openSync(DIGEST_PATH, 'w');
  trace('writing digest content header');
  fs.writeSync(fd, DIGEST_CONTENT_HEADER);

  // Write the digest content, as if it were output by the sha512sum command.
  trace('writing digest content');
  for (let modulePath of modulePaths) {
    let sha512Func = crypto.createHash('sha512');
    let moduleBuffer = fs.readFileSync(modulePath);
    let moduleHash = sha512Func.update(moduleBuffer).digest('hex');
    fs.writeSync(fd, `${moduleHash}  ${modulePath}\n`);
  }

  // Write the digest content separator and close the file descriptor.
  trace('writing digest content separator');
  fs.writeSync(fd, DIGEST_CONTENT_SEPARATOR);
  fs.closeSync(fd);
}

// Check the unsigned digest file.
function checkUnsignedDigest () {
  // Read the digest content and check its header.
  trace('checking digest content header');
  const digestBuffer = fs.readFileSync(DIGEST_PATH);
  const digestContent = digestBuffer.toString('utf8').split('\0', 1)[0];
  if (!digestContent.startsWith(DIGEST_CONTENT_HEADER)) {
    throw 'bad header in digest file: ' + DIGEST_PATH;
  }
  // TODO: Execute "sha512sum -c" or perform a compatible check.
  warn('TODO: check the digest content');
}

// Sign the digest file.
function signDigest () {
  // Find the sign-file program in the ML SDK.
  // Also search for mldb. This is not strictly necessary, although
  // it is a useful validation for the location of the ML SDK root.
  const mabuPath = which.sync('mabu');
  const mlsdkRoot = path.dirname(mabuPath);
  const exeExt = process.platform === 'win32' ? '.exe' : '';
  const mldbPath = path.resolve(mlsdkRoot, 'tools/mldb/mldb' + exeExt);
  fs.accessSync(mldbPath, fs.constants.X_OK);
  const signFilePath = path.resolve(mlsdkRoot, 'tools/signer/sign-file' + exeExt);
  fs.accessSync(signFilePath, fs.constants.X_OK);

  // Find the certification file and the private key file.
  const mlCertPath = process.env['MLCERT'];
  if (!mlCertPath) {
    throw 'missing $MLCERT';
  }
  fs.accessSync(mlCertPath, fs.constants.F_OK);
  const mlPrivKeyPath = path.resolve(
    path.dirname(mlCertPath),
    path.basename(mlCertPath, '.cert') + '.privkey'
  );
  fs.accessSync(mlPrivKeyPath, fs.constants.F_OK);
  function signFile () {
    // Sign DIGEST_PATH.
    trace('signing digest file');
    execFile(
      signFilePath,
      ['-f', 'sha512', mlPrivKeyPath, mlCertPath, DIGEST_PATH],
      (error, stdout, stderr) => {
        if (error) {
          throw error;
        }
      }
    );
  }
  if (!argv.debug) {
    signFile();
    return;
  }
  let python = path.join(mlsdkRoot,
    process.platform === 'win32'
      ? '/tools/python3/python.exe'
      : '/tools/python3/bin/python3.5'
  );
  let script = path.join(mlsdkRoot, '/tools/mabu/src/taildata_v3.py');
  let tailDataCommand = `${python} ${script} --sbox USER --debuggable ${DIGEST_PATH}`;
  console.info('Adding tail data');
  exec(tailDataCommand, (err, stdout, stderr) => {
    console.log(stdout);
    if (err) {
      console.error('Error Adding tail data:', err);
    }
    if (stderr) {
      console.error('Error Adding tail data:', err);
    }
    signFile();
  });
}

/// ///////////////////////////////////////////////////////////////////////////
// Main

try {
  if (argv.check) {
    if (argv._.length) {
      warn('checking the digest file; ignoring the paths in the command line');
    }
    trace('checking digest file: ' + DIGEST_PATH);
    checkUnsignedDigest();
    // TODO: Check signature.
  } else {
    if (!argv._.length) {
      // FIXME: Use argv.showHelp(); why does it not work?
      die(`no modules for digesting; type '${argv.$0} --help'`);
    }
    checkModulePaths(argv._);
    trace('creating digest file: ' + DIGEST_PATH);
    createUnsignedDigest(argv._);
    signDigest();
  }
  trace('done!');
} catch (err) {
  die(err);
}
