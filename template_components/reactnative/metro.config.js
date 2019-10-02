/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path');

module.exports = {
  projectRoot: path.resolve(__dirname),
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false
      }
    })
  },
  watchFolders: [
    path.resolve(__dirname, '../common'),
    path.resolve(__dirname, '../src'),
    path.resolve(__dirname, 'node_modules')
  ],
  resolver: {
    extraNodeModules: new Proxy({}, {
      get: (target, name) => path.join(process.cwd(), `node_modules/${name}`)
    })
  }
};
