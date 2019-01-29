// Rollup config for consuming some npm modules in MagicScript
// To use this, you need to convert your source to be compiled
// by rollup.  First remove the shebang line from main.js and
// move your sources to the src folder.:
//
//     mkdir src
//     mv script/*.js src/
//
// If you don't already have rollup, install it globally:
//
//     npm install -g rollup rollup-plugin-node-resolve rollup-plugin-commonjs
//
// While developing, have rollup running in the background to keep your script
// folder in sync with your src folder:
//
//     rollup -w -c
//
// Now you can edit your app in the src folder and try to include some npm modules.
// For example, you can install packages like `underscore` or `mobx`
//
//     npm i underscore
//
// And in your app under src, do:
//
//     import _ from "underscore";
//     const { map } = _;

import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

export default {
  external: ["uv", "lumin"],
  input: "src/main.js",
  output: {
    file: "script/main.js",
    intro: "#!/system/bin/script/mxs\nglobalThis.window=globalThis;\n",
    format: "es"
  },
  plugins: [resolve(), commonjs()]
};