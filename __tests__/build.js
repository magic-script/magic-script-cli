jest.mock('../lib/buildutils.js');
jest.mock('../lib/logger.js');

const buildUtils = require('../lib/buildutils');
const build = require('../commands/build');
const logger = require('../lib/logger');

const nextTick = () => new Promise((res) => process.nextTick(res));

afterEach(() => {
  jest.clearAllMocks();
});

describe('Test build', () => {
  test('should install node modules twice and execute lumin components build if its multiplatform structure', async () => {
    buildUtils.npmInstallIfNeeded.mockImplementation((path, callback) => {
      callback();
    });
    buildUtils.isMultiplatformStructure = jest.fn().mockReturnValueOnce(true);
    buildUtils.isTargetSpecified.mockReturnValueOnce(true);

    build({ _: ['build'], install: false, target: 'lumin' });
    await nextTick();
    expect(buildUtils.npmInstallIfNeeded).toHaveBeenCalledTimes(2);
    expect(buildUtils.isMultiplatformStructure).toHaveBeenCalled();
    expect(buildUtils.navigateToLuminDirectory).toHaveBeenCalled();
    expect(buildUtils.buildLumin).toHaveBeenCalledWith(expect.anything(), "#!/system/bin/script/mxs\nimport './lumin/src/main.js';\n");
  });

  test('should install node modules once and execute vanilla lumin build if its not multiplatform structure ', async () => {
    buildUtils.npmInstallIfNeeded.mockImplementation((path, callback) => {
      callback();
    });
    buildUtils.isMultiplatformStructure = jest.fn().mockReturnValueOnce(false);
    buildUtils.isTargetSpecified.mockReturnValueOnce(true);

    build({ _: ['build'], install: false, target: 'lumin' });
    await nextTick();
    expect(buildUtils.npmInstallIfNeeded).toHaveBeenCalledTimes(1);
    expect(buildUtils.isMultiplatformStructure).toHaveBeenCalled();
    expect(buildUtils.buildLumin).toHaveBeenCalled();
  });

  test('should install node modules twice and execute android build ', async () => {
    buildUtils.npmInstallIfNeeded.mockImplementation((path, callback) => {
      callback();
    });
    buildUtils.isTargetSpecified.mockReturnValueOnce(true);
    buildUtils.isReactNativeTarget.mockReturnValueOnce(true);

    build({ _: ['build'], install: false, target: 'android' });
    await nextTick();

    expect(buildUtils.npmInstallIfNeeded).toHaveBeenCalledTimes(2);
    expect(buildUtils.isMultiplatformStructure).not.toHaveBeenCalled();
    expect(buildUtils.buildLumin).not.toHaveBeenCalled();
    expect(buildUtils.isReactNativeTarget).toHaveBeenCalled();
    expect(buildUtils.buildAndroid).toHaveBeenCalled();
  });

  test('should install node modules twice and execute ios build ', async () => {
    buildUtils.npmInstallIfNeeded.mockImplementation((path, callback) => {
      callback();
    });
    buildUtils.isTargetSpecified.mockReturnValueOnce(true);
    buildUtils.isReactNativeTarget.mockReturnValueOnce(true);

    build({ _: ['build'], install: false, target: 'ios' });
    await nextTick();
    expect(buildUtils.npmInstallIfNeeded).toHaveBeenCalledTimes(2);
    expect(buildUtils.isMultiplatformStructure).not.toHaveBeenCalled();
    expect(buildUtils.buildLumin).not.toHaveBeenCalled();
    expect(buildUtils.isReactNativeTarget).toHaveBeenCalled();
    expect(buildUtils.buildiOS).toHaveBeenCalled();
  });

  test('should show error message if target is wrong', async () => {
    buildUtils.isTargetSpecified = jest.fn().mockReturnValueOnce(false);
    build({ _: ['build'], install: false, target: 'wrongTarget' });
    await nextTick();
    expect(buildUtils.npmInstallIfNeeded).not.toHaveBeenCalled();
    expect(logger.red).toHaveBeenCalledWith('The target must be either lumin, ios or android!');
  });
});
