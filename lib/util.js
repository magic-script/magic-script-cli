let fs = require('fs')
let parser = require('xml2json')
let { exec } = require('child_process')

module.exports.findPackageName = function() {
  let manifestPath ="manifest.xml"
  var packageName = ""
  if (!fs.existsSync(manifestPath)) {
    console.error("manifest.xml doesn't exist in current directory")
  } else {
    let manifest = fs.readFileSync(manifestPath)
    if (manifest) {
      let manifestJSON = JSON.parse(parser.toJson(manifest))
      if (manifestJSON && manifestJSON["manifest"]) {
        let innerManifest = manifestJSON["manifest"]
        if (innerManifest && innerManifest["ml:package"]) {
          packageName = innerManifest["ml:package"]
        }
      }
    }
  }
  return packageName
}

module.exports.isInstalled = function(packageName, callback) {
  exec("mldb packages -j", (err, stdout, stderr) => {
    if (err) {
      console.error("error getting installed packages:", err)
      callback(false)
      return
    }
    let packagesJSON = JSON.parse(stdout)
    if (packagesJSON) {
      var found = false
      for (let packageObj of packagesJSON) {
        if (packageObj["package"] === packageName) {
          found = true
          break
        }
      }
      if (found) {
        callback(true)
        return
      }
    } else {
      console.error("Failed to parse packages JSON")
    }
    callback(false)
  })
}

module.exports.createDigest = function() {
  signScript = __dirname + "/../util/mxs-sign"
  if (!fs.existsSync(signScript)) {
    console.error("Signing Script not available")
    return
  }
  exec(`${signScript} script/`,(err, stdout, stderr) => {
    if (err) {
      console.error("error getting installed packages:", err)
      return
    }
    console.log(stdout)
  })
}
