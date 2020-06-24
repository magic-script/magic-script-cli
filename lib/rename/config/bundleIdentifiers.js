// nS - No Space
// lC - Lowercase
let path = require('path');

module.exports.bundleIdentifiers = function (
  currentAppName,
  newName,
  currentBundleID,
  newBundleID,
  newBundlePath
) {
  console.log(
    `newName: ${newName} currAppName: ${currentAppName} newBundleId: ${newBundleID} newbundlePath: ${newBundlePath} currentBundleId: ${currentBundleID}`
  );
  const noSpaceCurrentAppName = currentAppName.replace(/\s/g, '');
  const noSpaceNewName = newName.replace(/\s/g, '');
  const lowcaseNoSpaceCurrentBundleID = currentBundleID.toLowerCase();
  const lowcaseNoSpaceNewBundleID = newBundleID.toLowerCase();

  return [
    {
      regex: currentBundleID,
      replacement: newBundleID,
      paths: [
        'android/app/BUCK',
        'android/app/build.gradle',
        'android/app/src/main/AndroidManifest.xml'
      ]
    },
    {
      regex: currentBundleID,
      replacement: newBundleID,
      paths: [
        path.join(`${newBundlePath}`, 'MainActivity.java'),
        path.join(`${newBundlePath}`, 'MainApplication.java')
      ]
    },
    {
      regex: lowcaseNoSpaceCurrentBundleID,
      replacement: lowcaseNoSpaceNewBundleID,
      paths: [path.join(`${newBundlePath}`, 'MainApplication.java')]
    },
    {
      // App name (probably) doesn't start with `.`, but the bundle ID will
      // include the `.`. This fixes a possible issue where the bundle ID
      // also contains the app name and prevents it from being inappropriately
      // replaced by an update to the app name with the same bundle ID
      regex: new RegExp(`(?!\\.)(.|^)${noSpaceCurrentAppName}`, 'g'),
      replacement: `$1${noSpaceNewName}`,
      paths: [path.join(`${newBundlePath}`, 'MainActivity.java')]
    },
    {
      regex: currentBundleID,
      replacement: newBundleID,
      paths: [
        path.join('ios', `${noSpaceNewName}.xcodeproj`, 'project.pbxproj')
      ]
    }
  ];
};
