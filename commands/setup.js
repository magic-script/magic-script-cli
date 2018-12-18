const util = require('util')
const fs = require('fs')
const pathJoin = require('path').join
const homedir = require('os').homedir()

const readFile = util.promisify(fs.readFile)

async function findSdk () {
  // First find `.ml_pm.json` to get the various roots.
  let roots
  try {
    roots = JSON.parse(await readFile(pathJoin(homedir, 'MagicLeap/.metadata/.ml_pm.json'), 'utf8'))
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    try {
      roots = JSON.parse(await readFile(pathJoin(homedir, '.ml_pm.json'), 'utf8'))
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      throw new Error('No SDK roots found.')
    }
  }
  // Then read the data from each root.
  for (let { package_info: path } of roots.roots) {
    let { rel_root_path: relRootPath, packages } = JSON.parse(await readFile(path))
    let rootPath = pathJoin(path, relRootPath)
    console.log({ rootPath, packages })
    for (let name in packages) {
      console.log(packages[name])
      for (let { version, rel_path: relPath } of packages[name]) {
        console.log({ relPath })
        let packagePath = pathJoin(rootPath, '..', relPath)
        console.log({ name, version, packagePath })
      }
    }
  }
}

module.exports = argv => {
  findSdk().catch(console.error)
}
