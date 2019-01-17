// The 'lumin' module is built-in and exposes Lumin Runtime APIs as-is
import { ImmersiveApp, PrismType } from "lumin";

// We can also load code from local modules included in the app bundle using browser compatible paths.
import { makeLine } from "./line.js";

class MyApp extends ImmersiveApp {
  init() {
    let prism = this.requestNewPrism([1, 1, 1], PrismType.kWorld);
    let node = makeLine(prism);
    prism.getRootNode().addChild(node);
  }
}

let app = new MyApp(0.016);
app.run();
