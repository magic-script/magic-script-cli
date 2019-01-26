#!/system/bin/script/mxs

import { LandscapeApp, ui } from "lumin";

import { setTimeout, setInterval, fetch } from "./builtins.js";

class App extends LandscapeApp {
  init() {
    let prism = this.requestNewPrism([0.5, 0.5, 0.5]);
    let text = ui.UiText.CreateEclipseLabel(
      prism,
      "Hello\nMagicScript!",
      ui.EclipseLabelType.kT7
    );
    text.setAlignment(ui.Alignment.CENTER_CENTER);
    text.setTextAlignment(ui.HorizontalAlignment.kCenter);
    prism.getRootNode().addChild(text);
    return 0;
  }
  updateLoop(delta) {
    return true;
  }
  eventListener(event) {
    return true;
  }
}

let app = new App(0.016);
app.run();
