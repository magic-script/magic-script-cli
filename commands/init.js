let process = require('process')
let fs = require('fs')
let templatePath = `${__dirname}/../template`
let XMLParser = require('xml2json');

var packageName;
var visibleName;
var projectName;

function updateManifest(contents) {
  var manifestJson = JSON.parse(XMLParser.toJson(contents))
  if (manifestJson && manifestJson["manifest"]) {
    var innerManifest = manifestJson["manifest"]
    if (innerManifest["ml:package"]) {
      innerManifest["ml:package"] = packageName
    }
    var applicationJson = innerManifest["application"]
    applicationJson["ml:visible_name"] = visibleName
    componentJson = applicationJson["component"]
    componentJson["ml:visible_name"] = visibleName
    contents = XMLParser.toXml(manifestJson)
  }
  return contents
}

function copyFiles(srcPath, destPath) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath)
  }
  const filesToCreate = fs.readdirSync(srcPath)
    filesToCreate.forEach(file => {
      const origFilePath = `${srcPath}/${file}`
      const stats = fs.statSync(origFilePath)
    if (stats.isFile()) {
      var contents = fs.readFileSync(origFilePath, 'utf8')
      if (file === 'manifest.xml') {
        contents = updateManifest(contents)
      } else if (file.indexOf ("diagonal") > -1) {
        file = file.replace("diagonal", visibleName)
      }
      const writePath = `${destPath}/${file}`
      fs.writeFileSync(writePath, contents, 'utf8')
    } else if (stats.isDirectory()) {
      let newDestPath = `${destPath}/${file}`
      copyFiles(origFilePath, newDestPath)
    }
  })
}

module.exports = argv => {
  let nameRegex = /^([A-Za-z\-\_\d])+$/;
  let idRegex = /^[a-z0-9_]+(\.[a-z0-9_]+)*(-[a-zA-Z0-9]*)?$/i;
  if (!nameRegex.test(argv.projectName)) {
    console.error("Invalid project name")
    return -1
  } else if (!idRegex.test(argv.packageName)) {
    console.error("Bad package name:",argv.packageName)
    return -1
  }
  packageName = argv.packageName
  projectName = argv.projectName
  visibleName = argv.visibleName || projectName
  console.log("Project Name:", projectName)
  const currentDirectory = process.cwd()
  copyFiles(templatePath, `${currentDirectory}/${projectName}`)
}
