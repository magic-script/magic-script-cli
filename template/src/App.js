import { LandscapeApp, ui } from 'lumin';

export class App extends LandscapeApp {
  init() {
    let prism = this.requestNewPrism([0.5, 0.5, 0.5]);
    let text = ui.UiText.CreateEclipseLabel(
      prism,
      'Hello\nMagicScript!',
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
}
