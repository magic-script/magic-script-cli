module.exports.foldersAndFiles = function (currentAppName, newName) {
  const noSpaceCurrentAppName = currentAppName.replace(/\s/g, '');
  const noSpaceNewName = newName.replace(/\s/g, '');

  return [
    `ios/${noSpaceCurrentAppName}`,
    `ios/${noSpaceCurrentAppName}.xcodeproj`,
    `ios/${noSpaceNewName}.xcodeproj/xcshareddata/xcschemes/${noSpaceCurrentAppName}.xcscheme`,
    `ios/${noSpaceCurrentAppName}Tests`,
    `ios/${noSpaceNewName}Tests/${noSpaceCurrentAppName}Tests.m`,
    `ios/${noSpaceCurrentAppName}.xcworkspace`,
    `ios/${noSpaceCurrentAppName}-Bridging-Header.h`
  ];
};
