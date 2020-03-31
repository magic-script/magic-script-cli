import { LandscapeApp, ui } from 'lumin';
const { UiText, EclipseLabelType, Alignment, HorizontalTextAlignment } = ui;

function check<T>(val: T | null, message?: string): T {
  if (val === null) throw new Error(message || "Unexpected null encountered")
  return val;
}

export class App extends LandscapeApp {
  onAppStart() {
    // Create a new prism that's half a meter cubed.
    let prism = check(this.requestNewPrism([0.5, 0.5, 0.5]));

    // Create a nice text label using UIKit.
    let text = check(UiText.CreateEclipseLabel(
      prism,
      'Hello\nMagicScript!',
      EclipseLabelType.kT7
    ));
    text.setAlignment(Alignment.CENTER_CENTER);
    text.setTextAlignment(HorizontalTextAlignment.kCenter);

    // Attach the label to the root of the prism's scene graph.
    check(prism.getRootNode()).addChild(text);
  }

  // Known Issue
  // Web Inspector does not work unless the updateLoop function is present in source.
  // It can be removed for production code.
  updateLoop(delta: number) {
    return true;
  }

  init() {
    return 0;
  }
}
