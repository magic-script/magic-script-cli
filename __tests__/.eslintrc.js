// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under MIT License. See LICENSE file in the project root for full license information.
// ESLint config for jest tests in the magic-script-cli project.
module.exports = {
    "plugins": ["jest"],
    "env": {
        "jest/globals": true,
        "es6": true,
        "node": true
    },
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "extends": ["plugin:jest/recommended"],
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};
