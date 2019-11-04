import React from 'react';

import { View, Text, vec3 } from 'magic-script-components';

interface AppProps {
  type: 'landscape' | 'immersive';
  volumeSize: vec3;
}

interface Props extends AppProps {
  message: string;
}

interface State {
  message: string;
}

export default class MyApp extends React.Component<Props, State> {
  state: State = { message: '' }

  constructor(props: Props) {
    super(props);

    this.state = {
      message: props.message
    };
  }

  render() {
    return (
      <View name="main-view">
        <Text textSize={0.1} localPosition={[-0.3, 0, 0]}>
          {this.state.message}
        </Text>
      </View>
    );
  }
}
