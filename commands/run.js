let { exec, spawn } = require('child_process')
let ChromeLauncher = require('../lib/chromeLaunch')
let util = require('../lib/util')

let packageName
let debug

function isRunning(callback) {
  exec("mldb ps", (err, stdout, stderr) =>{
    var running = -1
    if (err) {
      console.error(`exec error: ${err}`)
      callback(running)
      return
    }
    let searcher = /(\d+)\s+\d+.+/g
    let matches = stdout.match(searcher)
    for (var i = 0; i < matches.length; ++i) {
      let match = matches[i]
      if (match.includes(packageName)) {
        var pid = match.substring(0,match.indexOf(" "))
        running = pid
        break
      }
    }
    callback(pid)
  })
}

function launchFunction(callback) {
  let autoPrivilege = debug ? "--auto-net-privs" : ""
  let launchCommand = `mldb launch  ${autoPrivilege} ${packageName}`
  console.info("Launching:", packageName)
  exec(launchCommand, (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`)
      callback(-1)
      return
    }
    if (stdout.includes("Success")) {
      function cb(result){
        callback(result)
      }
      isRunning(cb)
    }
  })
}

function terminateFunction(callback) {
  let launchCommand = "mldb terminate " + packageName
  console.info("Terminating:", packageName)
  exec(launchCommand, (err, stdout, stderr) => {
    setTimeout(callback, 1000)
  })
}
function launchCallback(pid) {
  if (pid == -1) {
    console.error("Failed to launch:", packageName)
    return -1
  }
  if (!debug) {
    return 0
  }
  const mldbCommand = spawn('mldb', ['log'])
  mldbCommand.stdout.on('data', (data) => {
    if (data.includes(pid) && data.includes('chrome')) {
      mldbCommand.kill()
      let dataString = `${data}`
      let pattern = /chrome.+:(\d{3,5})/
      let matches = dataString.match(pattern)
      if (matches.length > 1) {
        let port = matches[1]
        let forwardCommand = "mldb forward tcp:" + port + " tcp:" + port
        exec(forwardCommand, (err, stdout, stderr) => {
          if (!err && stdout.length == 0 && stderr.length == 0) {
            console.info('Success: port forwarded', port)
            var appName = "google-chrome"
            if (process.platform === "win32") {
              appName = "chrome"
            } else if (process.platform == "darwin") {
              appName = "google chrome"
            }
            console.info("Opening:",matches[0])
            const launcher = new ChromeLauncher()
            launcher.open(matches[0])
          }
        })
      }
    }
  })
  mldbCommand.stderr.on('data', (data) => {
    console.error(`mldbCommand stderr:\n${data}`)
  })
  console.info(packageName, "launched with PID:", pid)
}

module.exports = argv => {
  let arguments = argv._
  debug = argv.debug
  console.log(argv)
  async function parseManifest() {
    if (arguments.length > 1) {
      packageName = arguments[1]
    } else {
      packageName = util.findPackageName()
    }
    if (packageName) {
      function installedCallback(installed) {
        if (installed) {
          isRunning(runningCallback)
        } else {
          console.warn(`Package: ${packageName} is not installed.  Please install it.`)
        }
      }
      function runningCallback(pid) {
        if (pid == -1) {
          launchFunction(launchCallback)
        } else {
          function launchMe() {
            launchFunction(launchCallback)
          }
          terminateFunction(launchMe)
        }
      }
      util.isInstalled(packageName, installedCallback)
    }
  }
  parseManifest()
}
