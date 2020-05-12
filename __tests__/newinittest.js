/* eslint-disable no-trailing-spaces */
// Copyright (c) 2019 Magic Leap, Inc. All Rights Reserved
// Distributed under Apache 2.0 License. See LICENSE file in the project root for full license information.
jest.mock('../lib/initutils');
jest.mock('inquirer');
jest.mock('../lib/logger');
jest.mock('path');

const inquirer = require('inquirer');
const init = require('../commands/init');
const initUtil = require('../lib/initutils');
const logger = require('../lib/logger');
const path = require('path');

const nextTick = () => new Promise(res => process.nextTick(res));

afterEach(() => {
  jest.clearAllMocks();
});

describe('Test Components configurations', () => {
  const mockInquirer = data => {
    jest
      .spyOn(inquirer, 'prompt')
      .mockImplementationOnce(() => Promise.resolve(data));
  };

  function expectComponentsCreation() {
    expect(initUtil.copyComponentFiles).toHaveBeenCalled();
    expect(initUtil.renameComponentsFiles).toHaveBeenCalled();
    expect(initUtil.createSymlink).toHaveBeenCalled();
    expect(initUtil.preparePlatforms).toHaveBeenCalled();
    expect(path.join).toHaveBeenCalledWith(
      expect.anything(),
      '../template_multiplatform_components'
    );
  }

  function notExpectComponentsCreation() {
    expect(initUtil.copyComponentFiles).not.toHaveBeenCalled();
    expect(initUtil.renameComponentsFiles).not.toHaveBeenCalled();
    expect(initUtil.createSymlink).not.toHaveBeenCalled();
    expect(initUtil.preparePlatforms).not.toHaveBeenCalled();
  }

  function expectComponentsTypescript() {
    expect(initUtil.prepareComponentsTypescript).toHaveBeenCalled();
    expect(path.join).toHaveBeenCalledWith(
      expect.anything(),
      '../template_overlay_typescript_components'
    );
  }

  function notExpectComponentsTypescript() {
    expect(initUtil.prepareComponentsTypescript).not.toHaveBeenCalled();
    expect(path.join).not.toHaveBeenCalledWith(
      expect.anything(),
      '../template_overlay_typescript_components'
    );
  }

  function notExpectVanillaTypescript() {
    expect(initUtil.prepareTypescript).not.toHaveBeenCalled();
    expect(path.join).not.toHaveBeenCalledWith(
      expect.anything(),
      '../template_overlay_typescript'
    );
  }

  function expectVanillaTypescript() {
    expect(initUtil.prepareTypescript).toHaveBeenCalled();
    expect(path.join).toHaveBeenCalledWith(
      expect.anything(),
      '../template_overlay_typescript'
    );
  }

  describe('Prompt', () => {
    describe('Components', () => {
      describe('Non typescript', () => {
        test('Create Landscape Components with no target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Landscape',
            ISCOMPONENTS: true,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0'
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          notExpectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });

        test('Create Immersive Components with no target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Immersive',
            ISCOMPONENTS: true,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0'
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          notExpectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });

        test('Create Immersive Components with Android & iOS target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Immersive',
            ISCOMPONENTS: true,
            TARGET: ['Android', 'iOS'],
            FOLDERNAME: 'FolderName2',
            APPID: 'com.test.0'
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          notExpectComponentsTypescript();
          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName2'
          );
        });

        test('Create Landscape Components with Android & iOS target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Landscape',
            ISCOMPONENTS: true,
            TARGET: ['Android', 'iOS'],
            FOLDERNAME: 'FolderName2',
            APPID: 'com.test.0'
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          notExpectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName2'
          );
        });
      });

      describe('Typescript', () => {
        test('Create Landscape Components with no target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Landscape',
            ISCOMPONENTS: true,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0',
            TYPESCRIPT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });

        test('Create Immersive Components with no target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Immersive',
            ISCOMPONENTS: true,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0',
            TYPESCRIPT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });

        test('Create Immersive Components with Android & iOS target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Immersive',
            ISCOMPONENTS: true,
            TARGET: ['Android', 'iOS'],
            FOLDERNAME: 'FolderName2',
            APPID: 'com.test.0',
            TYPESCRIPT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName2'
          );
        });

        test('Create Landscape Components with Android & iOS target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Landscape',
            ISCOMPONENTS: true,
            TARGET: ['Android', 'iOS'],
            FOLDERNAME: 'FolderName2',
            APPID: 'com.test.0',
            TYPESCRIPT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName2'
          );
        });
      });

      describe('Git repository', () => {
        test('Create Landscape Components with no target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Landscape',
            ISCOMPONENTS: true,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0',
            TYPESCRIPT: true, 
            GIT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(initUtil.createGitRepository).toHaveBeenCalledWith(
            'FolderName1'
          );

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });

        test('Create Immersive Components with no target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Immersive',
            ISCOMPONENTS: true,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0',
            TYPESCRIPT: true,
            GIT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(initUtil.createGitRepository).toHaveBeenCalledWith(
            'FolderName1'
          );

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });

        test('Create Immersive Components with Android & iOS target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Immersive',
            ISCOMPONENTS: true,
            TARGET: ['Android', 'iOS'],
            FOLDERNAME: 'FolderName2',
            APPID: 'com.test.0',
            TYPESCRIPT: true,
            GIT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(initUtil.createGitRepository).toHaveBeenCalledWith(
            'FolderName2'
          );

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName2'
          );
        });

        test('Create Landscape Components with Android & iOS target specified', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Landscape',
            ISCOMPONENTS: true,
            TARGET: ['Android', 'iOS'],
            FOLDERNAME: 'FolderName2',
            APPID: 'com.test.0',
            TYPESCRIPT: true,
            GIT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(initUtil.createGitRepository).toHaveBeenCalledWith(
            'FolderName2'
          );

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName2'
          );
        });
      });

    });

    describe('Vanilla Magic Script', () => {
      describe('No typescript support', () => {
        test('Create Vanilla Landscape app', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Landscape',
            ISCOMPONENTS: false,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0'
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating Vanilla Magic Script project for Landscape app type'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Vanilla Magic Script project successfully created for Landscape app type'
          );

          notExpectComponentsCreation();

          expect(initUtil.copyVanillaFiles).toHaveBeenCalled();

          notExpectVanillaTypescript();
          
          expect(initUtil.createGitRepository).not.toHaveBeenCalledWith(
            'FolderName1'
          );

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });

        test('Create Vanilla Immersive app', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Immersive',
            ISCOMPONENTS: false,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0'
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating Vanilla Magic Script project for Immersive app type'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Vanilla Magic Script project successfully created for Immersive app type'
          );

          notExpectComponentsCreation();

          expect(initUtil.copyVanillaFiles).toHaveBeenCalled();

          notExpectVanillaTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });
      });
      describe('Typescript support', () => {
        test('Create Vanilla Landscape app', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Landscape',
            ISCOMPONENTS: false,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0',
            TYPESCRIPT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating Vanilla Magic Script project for Landscape app type'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Vanilla Magic Script project successfully created for Landscape app type'
          );

          notExpectComponentsCreation();

          expect(initUtil.copyVanillaFiles).toHaveBeenCalled();

          expectVanillaTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });

        test('Create Vanilla Immersive app', async () => {
          //given
          mockInquirer({
            APPNAME: 'TestApp',
            APPTYPE: 'Immersive',
            ISCOMPONENTS: false,
            FOLDERNAME: 'FolderName1',
            APPID: 'com.test.0',
            TYPESCRIPT: true
          });

          //when
          init({ _: ['init'] });
          await nextTick();

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating Vanilla Magic Script project for Immersive app type'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Vanilla Magic Script project successfully created for Immersive app type'
          );

          notExpectComponentsCreation();

          expect(initUtil.copyVanillaFiles).toHaveBeenCalled();

          expectVanillaTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'FolderName1'
          );
        });
      });
    });
  });

  describe('Terminal', () => {
    describe('Components', () => {
      describe('Non typescript', () => {
        test('Create Landscape Components with no target specified', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            visibleName: 'visibleName',
            appType: 'Landscape',
            isComponents: true,
            packageName: 'com.package.name'
          });

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          notExpectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });

        test('Create Immersive Components with no target specified', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Immersive',
            isComponents: true,
            packageName: 'com.package.name'
          });

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          notExpectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });

        test('Create Immersive Components with Android & iOS target specified', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Immersive',
            isComponents: true,
            packageName: 'com.package.name',
            target: ['Android', 'iOS']
          });

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          notExpectComponentsTypescript();
          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });

        test('Create Landscape Components with Android & iOS target specified', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Landscape',
            isComponents: true,
            packageName: 'com.package.name',
            target: ['Android', 'iOS']
          });

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          notExpectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });
      });

      describe('Typescript', () => {
        test('Create Landscape Components with no target specified', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Landscape',
            isComponents: true,
            packageName: 'com.package.name',
            typeScript: true
          });

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });

        test('Create Immersive Components with no target specified', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Immersive',
            isComponents: true,
            packageName: 'com.package.name',
            typeScript: true
          });

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: LUMIN'
          );
          expect(logger.yellow).toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: LUMIN'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });

        test('Create Immersive Components with Android & iOS target specified', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Immersive',
            isComponents: true,
            packageName: 'com.package.name',
            target: ['Android', 'iOS'],
            typeScript: true
          });

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });

        test('Create Landscape Components with Android & iOS target specified', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Landscape',
            isComponents: true,
            packageName: 'com.package.name',
            target: ['Android', 'iOS'],
            typeScript: true
          });

          //then
          expect(logger.green).toHaveBeenCalledWith(
            'Start creating project for Components type, target: ANDROID,IOS'
          );
          expect(logger.yellow).not.toHaveBeenCalledWith(
            'There is no proper target passed, project will generate Lumin files structure for Components app'
          );
          expect(logger.green).toHaveBeenCalledWith(
            'Project successfully created for platforms: ANDROID,IOS'
          );

          expectComponentsCreation();
          expectComponentsTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });
      });
    });

    describe('Vanilla Magic Script', () => {
      describe('No typescript support', () => {
        test('Create Vanilla Landscape app', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Landscape',
            isComponents: false,
            packageName: 'com.package.name'
          });

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating Vanilla Magic Script project for Landscape app type'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Vanilla Magic Script project successfully created for Landscape app type'
          );

          notExpectComponentsCreation();

          expect(initUtil.copyVanillaFiles).toHaveBeenCalled();

          notExpectVanillaTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });

        test('Create Vanilla Immersive app', async () => {
          //given
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Immersive',
            isComponents: false,
            packageName: 'com.package.name'
          });

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating Vanilla Magic Script project for Immersive app type'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Vanilla Magic Script project successfully created for Immersive app type'
          );

          notExpectComponentsCreation();

          expect(initUtil.copyVanillaFiles).toHaveBeenCalled();

          notExpectVanillaTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });
      });
      describe('Typescript support', () => {
        test('Create Vanilla Landscape app', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Landscape',
            isComponents: false,
            packageName: 'com.package.name',
            typeScript: true
          });

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating Vanilla Magic Script project for Landscape app type'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Vanilla Magic Script project successfully created for Landscape app type'
          );

          notExpectComponentsCreation();

          expect(initUtil.copyVanillaFiles).toHaveBeenCalled();

          expectVanillaTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });

        test('Create Vanilla Immersive app', async () => {
          init({
            _: ['init'],
            appName: 'TestApp',
            folderName: 'TerminalTest',
            appType: 'Immersive',
            isComponents: false,
            packageName: 'com.package.name',
            typeScript: true
          });

          //then
          expect(logger.green).toHaveBeenNthCalledWith(
            1,
            'Start creating Vanilla Magic Script project for Immersive app type'
          );
          expect(logger.green).toHaveBeenNthCalledWith(
            2,
            'Vanilla Magic Script project successfully created for Immersive app type'
          );

          notExpectComponentsCreation();

          expect(initUtil.copyVanillaFiles).toHaveBeenCalled();

          expectVanillaTypescript();

          expect(path.join).toHaveBeenCalledWith(
            expect.anything(),
            'TerminalTest'
          );
        });
      });
    });
  });


  describe('Common', () => {
    test('Throw error', async () => {
      //given
      mockInquirer({
        APPTYPE: 'Landscape',
        FOLDERNAME: 'ComponentsLumin',
        APPID: 'com.test.0',
        TYPESCRIPT: true
      });
      initUtil.copyVanillaFiles.mockImplementationOnce(() => {
        throw new Error();
      });
    
      //when
      expect(() => {
        init({ _: ['init'] });
    
        //then
        expect(logger.red).toHaveBeenCalled();
      }).toThrow();
    });
  });
});
