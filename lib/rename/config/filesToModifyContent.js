// nS - No Space
// lC - Lowercase
import path from 'path';

module.exports.filesToModifyContent = function (currentAppName, newName) {
  const noSpaceCurrentAppName = currentAppName.replace(/\s/g, '');
  const noSpaceNewName = newName.replace(/\s/g, '');

  return [
    {
      regex: `<string name="app_name">${currentAppName}</string>`,
      replacement: `<string name="app_name">${newName}</string>`,
      paths: ['android/app/src/main/res/values/strings.xml']
    },
    {
      regex: noSpaceCurrentAppName,
      replacement: noSpaceNewName,
      paths: [
        'index.js',
        'index.android.js',
        'index.ios.js',
        path.join('ios', `${noSpaceNewName}.xcodeproj`, 'project.pbxproj'),
        path.join('ios', `${noSpaceNewName}.xcworkspace`, 'contents.xcworkspacedata'),
        path.join('ios', `${noSpaceNewName}.xcodeproj`, 'xcshareddata', 'xcschemes', `${noSpaceNewName}.xcscheme`),
        path.join('ios', `${noSpaceNewName}`, 'AppDelegate.m'),
        path.join('android', 'settings.gradle'),
        path.join('ios', `${noSpaceNewName}Tests`, `${noSpaceNewName}Tests.m`),
        path.join('ios', 'build', 'info.plist'),
        path.join('ios', 'Podfile'),
        'app.json'
      ]
    },
    {
      regex: `text="${currentAppName}"`,
      replacement: `text="${newName}"`,
      paths: [path.join('ios', `${noSpaceNewName}`, 'Base.lproj', 'LaunchScreen.xib')]
    },
    {
      regex: currentAppName,
      replacement: newName,
      paths: [path.join('ios', `${noSpaceNewName}`, 'Info.plist')]
    },
    {
      regex: `"name": "${noSpaceCurrentAppName}"`,
      replacement: `"name": "${noSpaceNewName}"`,
      paths: ['package.json']
    },
    {
      regex: `"displayName": "${currentAppName}"`,
      replacement: `"displayName": "${newName}"`,
      paths: ['app.json']
    }
  ];
};
