const child_process = jest.genMockFromModule('child_process')
const rewire = require('rewire')

const fs = jest.genMockFromModule('fs')
const parser = jest.genMockFromModule('xml2json')

var run, util;

beforeEach(() => {
    util = rewire('../lib/util')
    run = rewire('../commands/run')
    jest.mock('child_process')
    child_process.exec = jest.fn()
    child_process.spawn = jest.fn()
    parser.toJson = jest.fn()
    run.__set__('exec', child_process.exec)
    run.__set__('spawn', child_process.spawn)
    util.__set__('parser', parser)
    util.__set__('exec', child_process.exec)
});

describe('Test Util', () => {

    test('isInstalled error', () => {
        util.isInstalled("com.abc", function(result){
            expect(result).toBeFalsy()
        })
        expect(child_process.exec.mock.calls.length == 1)
        let call = child_process.exec.mock.calls[0]
        if (call) {
            expect(call[0] === "mldb packages -j")
            call[1](true)
        }
    })

    test('isInstalled not called', () => {
        expect(child_process.exec.mock.calls.length == 0).toBeTruthy
    })

    test('isInstalled no match', () => {
        util.isInstalled("com.abc", function(result){
            expect(result).toBeFalsy()
        })
        expect(child_process.exec.mock.calls.length === 1).toBeTruthy()
        let call = child_process.exec.mock.calls[0]
        if (call && call.length > 1) {
            expect(call[0] === "mldb packages -j").toBeTruthy()
            call[1](0, '[{"asdf":1 }]')
        }
    })

    test('isInstalled match', () => {
        util.isInstalled("com.abc", function(result){
            expect(result).toBeTruthy()
        })
        expect(child_process.exec.mock.calls.length === 1).toBeTruthy()
        let call = child_process.exec.mock.calls[0]
        if (call && call.length > 1) {
            expect(call[0] === "mldb packages -j").toBeTruthy()
            call[1](0, '[{"package":"com.abc" }]')
        }
    })

    test('isInstalled parse error', () => {
        util.isInstalled("com.abc", function(result){
            expect(result).toBeFalsy()
        })
        expect(child_process.exec.mock.calls.length === 1).toBeTruthy()
        let call = child_process.exec.mock.calls[0]
        if (call && call.length > 1) {
            expect(call[0] === "mldb packages -j").toBeTruthy()
            call[1](0, null)
        }
    })

    test('findPackageName no manifest', () => {
        util.__set__('fs', fs)
        fs.existsSync.mockReturnValue(false)
        let name = util.findPackageName()
        expect(fs.existsSync).toBeCalled()
        expect(name === "").toBeTruthy()
    })

    test('findPackageName manifest com.abc', () => {
        util.__set__('fs', fs)
        util.__set__('parser', parser)
        fs.existsSync.mockReturnValue(true)
        fs.readFileSync.mockReturnValue([])
        parser.toJson.mockReturnValue("{\"manifest\":{\"ml:package\":\"com.abc\"}}")
        let name = util.findPackageName()
        expect(fs.existsSync).toBeCalled()
        expect(fs.readFileSync).toBeCalled()
        expect(name === "com.abc").toBeTruthy()
    })

    test('findPackageName manifest null', () => {
        util.__set__('fs', fs)
        util.__set__('parser', parser)
        fs.existsSync.mockReturnValue(true)
        fs.readFileSync.mockReturnValue(null)
        let name = util.findPackageName()
        expect(fs.existsSync).toBeCalled()
        expect(fs.readFileSync).toBeCalled()
        expect(name === "").toBeTruthy()
    })
})
describe('Test Run', () => {

    test('not installed "com.abc"', () => {
        run.__set__('util.isInstalled', jest.fn().mockImplementation((packageName, callback) => {
            expect(packageName == "com.abc").toBeTruthy()
            callback(false)
        }))
        run({"_":["run", "com.abc"]})
        expect(run.__get__('packageName') === "com.abc").toBeTruthy()
    })

    test('no packageName', () => {
        const mockFindPackageName = jest.fn();
        mockFindPackageName.mockReturnValue("")
        run.__set__('util.findPackageName', mockFindPackageName)
        run({"_":["run"]})
        expect(mockFindPackageName).toBeCalled()
    })

    test('Installed "com.abc"', () => {
        const mockIsInstalled = jest.fn();
        const mockFindPackageName = jest.fn();
        mockFindPackageName.mockReturnValue("")
        run.__set__('util.isInstalled', mockIsInstalled)
        run.__set__('util.findPackageName', mockFindPackageName)
        mockIsInstalled.mockImplementation((packageName, callback) => {
            expect(packageName === "com.abc").toBeTruthy()
            callback(true)
        })
        run({"_":["run", "com.abc"]})
        expect(mockIsInstalled).toBeCalled()
        expect(child_process.exec).toBeCalled()
        if (child_process.exec.mock.calls.length > 0) {
            expect(child_process.exec.mock.calls[0][0] === "mldb ps")
        }
    })

    test('Installed "com.abc" running', () => {
        const mockIsInstalled = jest.fn();
        const mockFindPackageName = jest.fn();
        mockFindPackageName.mockReturnValue("")
        run.__set__('util.isInstalled', mockIsInstalled)
        run.__set__('util.findPackageName', mockFindPackageName)
        mockIsInstalled.mockImplementation((packageName, callback) => {
            expect(packageName === "com.abc").toBeTruthy()
            callback(true)
        })
        child_process.exec.mockImplementationOnce((command, callback) =>{
            expect(command === "mldb ps").toBeTruthy()
            callback(null, "1440 110011 Running com.abc .universe")
            expect(child_process.exec.mock.calls.length > 1)
            if (child_process.exec.mock.calls.length > 1) {
                expect(child_process.exec.mock.calls[1][0] === "mldb terminate com.abc").toBeTruthy()
            }
        })
        run({"_":["run", "com.abc"]})
        expect(mockIsInstalled).toBeCalled()
        expect(child_process.exec).toBeCalled()
        if (child_process.exec.mock.calls.length > 0) {
            expect(child_process.exec.mock.calls[0][0] === "mldb ps").toBeTruthy()
        }
    })
})
