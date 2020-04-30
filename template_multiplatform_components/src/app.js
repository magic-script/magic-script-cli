import React from 'react';
import { Prism, Scene, Text } from 'magic-script-components';

export default class MyApp extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      message: props.message
    };
  }

  render () {
    return (
      <Scene>
        <Prism size={[1.0, 1.0, 1.0]}>
          <Text textSize={0.1} localPosition={[-0.3, 0, 0]}>
            Hello Magic Script
          </Text>
        </Prism>
      </Scene>
    );
  }
}
