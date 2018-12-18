const { exec, spawn } = require('child_process')
const fs = require('fs')
const util = require('util')
const parser = require('xml2json')
const ChromeLauncher = require('../lib/chromeLaunch')

const readFile = util.promisify(fs.readFile)
let packageName

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
  let launchCommand = "mldb launch --auto-net-privs " + packageName
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
  async function parseManifest() {
    let manifestPath ="manifest.xml"
    if (!fs.existsSync(manifestPath)) {
      if (argv._.length > 1) {
        packageName = argv._[1]
      } else {
        console.error("manifest.xml doesn't exist in current directory")
        return -1
      }
    } else {
      let manifest = await readFile(manifestPath)
      if (manifest) {
        let manifestJSON = JSON.parse(parser.toJson(manifest))
        if (manifestJSON && manifestJSON["manifest"]) {
          let innerManifest = manifestJSON["manifest"]
          if (innerManifest["ml:package"]) {
            packageName = innerManifest["ml:package"]
          }
        }
      }
    }
    if (packageName) {
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
      isRunning(runningCallback)
    }
  }
  parseManifest()
}
