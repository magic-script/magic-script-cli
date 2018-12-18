# MagicScript Command Line Toolkit

This repository is the command line toolkit for generating, compiling, and running MagicScript applications.

## Install the Toolkit

Installation is easy assuming you have [Node.js](https://nodejs.org/) already installed.


```sh
npm install -g @magic-script/toolkit
```

You can now access the toolkit as `magic-script` in your system path.

Alternativaly, you can run without a permament install by creating an alias: `alias magic-script="npx @magic-script/toolkit"`

## SDK Setup

The toolkit can check to see if your system also has the needed dependencies for compiling the native C++ part of the application.

```sh
magic-script setup
```

This will check for dependencies like the MagicLeap SDK and show links to download and install them if they are missing.

Also you can set your personal configuration like preferred SDK version, personal signing key, etc.

## Generate a new Project

Projects can be easily generated and run from templates once you have the toolkit installed.

```sh
magic-script init my-new-project
cd my-new-project
magic-script run
```

