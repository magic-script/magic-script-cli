import { AppRegistry } from 'react-native';
import { ReactNativeMagicScript, NativeFileSystem, NativePlaneDetector } from 'magic-script-components-react-native';
import ReactNativeApp from '../react-native/ReactNativeApp';
import { FileSystem, PlaneDetector } from 'magic-script-components';

const MagicScript = {
    registerApp: (name, appComponent, debug = false) => {
        PlaneDetector.setNativePlaneDetector(new NativePlaneDetector());
        FileSystem.setNativeFileSystem(new NativeFileSystem());
        AppRegistry.registerComponent(name, () => ReactNativeApp);
        ReactNativeMagicScript.render(appComponent, { name: 'root' }, null, debug);
    }
};

export { MagicScript };
