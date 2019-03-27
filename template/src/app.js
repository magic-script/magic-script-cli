import { LandscapeApp, ui } from 'lumin';
const { UiText, EclipseLabelType, Alignment, HorizontalTextAlignment } = ui;

export class App extends LandscapeApp {
  onAppStart () {
    // Create a new prism that's half a meter cubed.
    let prism = this.requestNewPrism([0.5, 0.5, 0.5]);

    // Create a nice text label using UIKit.
    let text = UiText.CreateEclipseLabel(
      prism,
      'Hello\nMagicScript!',
      EclipseLabelType.kT7
    );
    text.setAlignment(Alignment.CENTER_CENTER);
    text.setTextAlignment(HorizontalTextAlignment.kCenter);

    // Attach the label to the root of the prism's scene graph.
    prism.getRootNode().addChild(text);
  }
}
