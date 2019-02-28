import { ui } from 'lumin';
const { UiText, EclipseLabelType, Alignment, HorizontalAlignment } = ui;

export default async function start(app) {
  let prism = app.requestNewPrism([0.5, 0.5, 0.5]);
  let text = UiText.CreateEclipseLabel(
    prism,
    'Hello\nMagicScript!',
    EclipseLabelType.kT7
  );
  text.setAlignment(Alignment.CENTER_CENTER);
  text.setTextAlignment(HorizontalAlignment.kCenter);
  prism.getRootNode().addChild(text);
  return prism;
}
