# MagicScript Command Line Toolkit

[![codecov](https://codecov.io/gh/magic-script/magic-script-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/magic-script/magic-script-cli)
[![CI](https://github.com/magic-script/magic-script-cli/workflows/CI/badge.svg)](https://github.com/magic-script/magic-script-cli/actions)
[![npm version](https://badge.fury.io/js/magic-script-cli.svg)](https://badge.fury.io/js/magic-script-cli)
[![npm downloads](https://img.shields.io/npm/dt/magic-script-cli.svg)](https://www.npmjs.com/package/magic-script-cli)
[![License](https://img.shields.io/:license-Apache%202.0-blue.svg)](LICENSE)

This repository is the command line toolkit for generating, compiling, and running MagicScript applications.

## Installation

Installation is easy assuming you have [Node.js](https://nodejs.org/) already installed.

```bash
npm install -g magic-script-cli
```

You can now access the toolkit as `magic-script` in your system path.

## Usage

See https://magicscript.org/ for more documentation.

## Developing for Multiplatform (MagicLeap, Android, iOS)

If you plan to develop for Android and/or iOS, follow instructions below:

### Tooling for iOS and Android

The detailed information on necessary tooling and setup for ReactNative you can find here: https://facebook.github.io/react-native/docs/getting-started
Verify your versions of tools with the minimum below:

**Common**:

| Tool   |      Version  |
|----------|:-------------:|
| NodeJS     |  >=12.10      |
| ReactNative CLI |    2.0.1   |
| NPM | should be installed with NodeJS |

**Android**:

To develop on Android platform, your device must support ARCore. To ensure your device supports ARCore visit: https://developers.google.com/ar/discover/supported-devices

| Tool   |      Version  |
|----------|:-------------:|
| Android SDK     |  >=28.0.3     |
| Gradle |    >=3.4.1  |
| Android Device OS | >=24 |
| JDK | >=8 |

**iOS**:
To develop on iOS platform, your device must support ARKit. To ensure your device supports ARKit visit and scroll to the bottom: https://www.apple.com/ios/augmented-reality/
Please be aware, that it is recommended to use the latest stable versions of below tools:

| Tool   |      Version  |
|----------|:-------------:|
| iOS device OS     |  >=12    |
| xCode | >=10  |
| CocoaPods | >=24 |

### First steps

**Creating a project**

1. Open terminal window, navigate to directory where you want to create the project and type `magic-script init`
2. Answer three questions about the Project Name, app ID (f.e. com.example.project) and Folder Name of the project
3. Using arrows choose what type of project do you want to create. For developing on multiple platforms choose `Components`
4. When you select `Components` type, you will be asked with 4th question. Using arrows and space bar, choose which platform you want to develop to
5. Done! Now you can navigate to the project and build the sample app on desired device!

**Building & running the project**

1. Navigate to the root directory of your project
2. Type `magic-script build android` or `magic-script build ios`. If you have device connected, the project will be built & installed on your device. That's it!
3. Type `magic-script build lumin` to build project for MagicLeap device. Type `magic-script build lumin -i` if you want to build & install the app on MagicLeap. That's it!

### Troubleshooting (for iOS and Android)

**Creating the project**
- If you have information that Android SDK environment variable doesn't exist, it means that local.properties file wasn't created under `<project>/reactnative/android`. 
a. If you have Android Studio installed, open `<project>/reactnative/android` as an Android project. The local.properties file should be created automatically
b. If not, create `local.properties` file in `<project>/reactnative/android` with one line: `sdk.dir=<Location of your Android SDK>`
<br/>
- If you have information that CLI couldn't create symlink for resources directory and you want to use resources on Android or iOS (like images, video, sounds, 3D model), you have to create a directory symlink in `<project>/reactnative/` pointing to `<project>/resources`. 
a. If you're Windows user, you can find more information here: https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/mklink
b. If you're MacOS or Linux user, you can use `ln` tool for that
<br/>
- If you have information that the project couldn't be renamed to the specified by the user, the project will be called `Template` and package id will be set to `com.magicscript.template`. If you want to change the name of the project and package id:
a. For Android use Android Studio to change the project name and package id
b. For iOS use XCode to change the project name and package id

**Building and installing the project**
- If you have problem with building & running the project, 

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details
