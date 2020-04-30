import { AppRegistry, Linking } from 'react-native';
import { ReactNativeMagicScript, NativeFileSystem, NativePlaneDetector, PlatformInformation } from 'magic-script-components-react-native';
import ReactNativeApp from '../react-native/ReactNativeApp';
import { FileSystem, PlaneDetector, Platform } from 'magic-script-components';

const MagicScript = {
    registerApp: (name, appComponent, debug = false) => {
        Platform.setPlatformInformation(new PlatformInformation());
        Platform.setLinking(Linking);
        PlaneDetector.setNativePlaneDetector(new NativePlaneDetector());
        FileSystem.setNativeFileSystem(new NativeFileSystem());
        AppRegistry.registerComponent(name, () => ReactNativeApp);
        ReactNativeMagicScript.render(appComponent, { name: 'root' }, null, debug);
    }
};

export { MagicScript };
