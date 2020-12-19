const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const normal = '\x1b[0m';

module.exports.red = function (text) {
  console.log(red, text);
};

module.exports.green = function (text) {
  console.log(green, text);
};

module.exports.yellow = function (text) {
  console.log(yellow, text);
};

module.exports.normal = function (text) {
  console.log(normal, text);
};
