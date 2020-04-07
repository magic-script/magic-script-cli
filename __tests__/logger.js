const logger = require('../lib/logger');

const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const normal = '\x1b[0m';

describe('Logger test', () => {
  test('should log with proper color', () => {
    jest.spyOn(console, 'log').mockImplementation();
    logger.yellow('yellow');
    logger.red('red');
    logger.green('green');
    logger.normal('normal');
    expect(console.log).toHaveBeenNthCalledWith(1, yellow, 'yellow');
    expect(console.log).toHaveBeenNthCalledWith(2, red, 'red');
    expect(console.log).toHaveBeenNthCalledWith(3, green, 'green');
    expect(console.log).toHaveBeenNthCalledWith(4, normal, 'normal');
  });
});
