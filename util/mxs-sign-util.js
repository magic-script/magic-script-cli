'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const which = require('which');
const { execFile, exec } = require('child_process');
module.exports = {
  /// ///////////////////////////////////////////////////////////////////////////
  // Constants

  // The digest file path.
  DIGEST_PATH: 'digest.sha512.signed',

  // The header (magic number and command) before the digest content.
  DIGEST_MAGIC: '#\u00A1\u007F',
  DIGEST_COMMAND: 'sha512sum -c',
  DIGEST_CONTENT_HEADER: this.DIGEST_MAGIC + this.DIGEST_COMMAND + '\n',

  // The separator between the digest content and the digital signature.
  DIGEST_CONTENT_SEPARATOR: '#\0',

  displayTrace: false,
  command: '',

  /// ///////////////////////////////////////////////////////////////////////////
  // Functions

  // Print the given message to console.error and terminate abnormally.
  die: function (message) {
    if (typeof message === 'string') {
      console.error('%s: Error: %s', this.command, message);
    } else {
      // This is a possibly complex exception; don't make it any fancier.
      console.error('%s: %s', this.command, message);
    }
    // Follow the Perl exit code convention.
    process.exit(255);
  },

  // Print the given message to console.warn.
  warn: function (message) {
    console.warn('%s: Warning: %s', this.command, message);
  },

  trace: function (message) {
    if (this.displayTrace) {
      console.debug('%s: ... %s', this.command, message);
    }
  },

  // Check the given module paths to ensure that they are relative and normalized.
  checkModulePaths: function (modulePaths) {
    for (let modulePath of modulePaths) {
      if (path.isAbsolute(modulePath)) {
        throw "can't sign absolute path: " + modulePath;
      }
      if (modulePath.match(/^\.(\.)?\//) || modulePath.match(/\/\.(\.)?\//)) {
        throw "can't sign non-normalized path: " + modulePath;
      }
    }
  },

  // Create the unsigned digest file from the given module paths.
  createUnsignedDigest: function (modulePaths) {
    // Open the file descriptor and write the digest content header.
    let fd = fs.openSync(this.DIGEST_PATH, 'w');
    this.trace('writing digest content header');
    fs.writeSync(fd, this.DIGEST_CONTENT_HEADER);

    // Write the digest content, as if it were output by the sha512sum command.
    this.trace('writing digest content');
    for (let modulePath of modulePaths) {
      let sha512Func = crypto.createHash('sha512');
      let moduleBuffer = fs.readFileSync(modulePath);
      let moduleHash = sha512Func.update(moduleBuffer).digest('hex');
      fs.writeSync(fd, `${moduleHash}  ${modulePath}\n`);
    }

    // Write the digest content separator and close the file descriptor.
    this.trace('writing digest content separator');
    fs.writeSync(fd, this.DIGEST_CONTENT_SEPARATOR);
    fs.closeSync(fd);
  },

  // Check the unsigned digest file.
  checkUnsignedDigest: function () {
    // Read the digest content and check its header.
    this.trace('checking digest content header');
    const digestBuffer = fs.readFileSync(this.DIGEST_PATH);
    const digestContent = digestBuffer.toString('utf8').split('\0', 1)[0];
    if (!digestContent.startsWith(this.DIGEST_CONTENT_HEADER)) {
      throw 'bad header in digest file: ' + this.DIGEST_PATH;
    }
    // TODO: Execute "sha512sum -c" or perform a compatible check.
    this.warn('TODO: check the digest content');
  },

  // Sign the digest file.
  signDigest: function (debug) {
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
    var signFile = function() {
      // Sign DIGEST_PATH.
      this.trace('signing digest file');
      execFile(
        signFilePath,
        ['-f', 'sha512', mlPrivKeyPath, mlCertPath, this.DIGEST_PATH],
        (error, stdout, stderr) => {
          if (error) {
            throw error;
          }
        }
      );
    }.bind(this);

    if (!debug) {
      signFile();
      return;
    }
    let python = path.join(mlsdkRoot,
      process.platform === 'win32'
        ? '/tools/python3/python.exe'
        : '/tools/python3/bin/python3.5'
    );
    let script = path.join(mlsdkRoot, '/tools/mabu/src/taildata_v3.py');
    let tailDataCommand = `${python} ${script} --sbox USER --debuggable ${this.DIGEST_PATH}`;
    console.info('Adding tail data');
    exec(tailDataCommand, (err, stdout, stderr) => {
      console.log(stdout);
      if (err) {
        console.error('Error Adding tail data:', err);
      }
      if (stderr) {
        console.error('Error Adding tail data:', stderr);
      }
      signFile();
    });
  }
};
