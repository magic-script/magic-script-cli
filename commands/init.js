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
      const writePath = `${destPath}/${file}`
      if (file === 'manifest.xml') {
        contents = updateManifest(contents)
      }
      fs.writeFileSync(writePath, contents, 'utf8')
    } else if (stats.isDirectory()) {
      let newDestPath = `${destPath}/${file}`
      copyFiles(origFilePath, newDestPath)
    }
  })
}

module.exports = argv => {
  if (!/^([A-Za-z\-\_\d])+$/.test(argv.projectName)) {
    console.error("Invalid project name")
    return -1
  } else if (!/^(?!:\/\/)[a-zA-Z]{2,6}\.([a-zA-Z0-9-]+\.)?[a-zA-Z0-9]+$/i.test(argv.packageName)) {
    console.error("Bad Package name:",argv.packageName)
    return -1
  }
  packageName = argv.packageName
  projectName = argv.projectName
  visibleName = argv.visibleName || projectName
  console.log("Project Name:", projectName)
  const currentDirectory = process.cwd()
  copyFiles(templatePath, `${currentDirectory}/${projectName}`)
}
