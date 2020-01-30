import React from 'react';

import { View, Text, AppProps } from 'magic-script-components';

interface Props extends AppProps {
  message: string;
}

interface State {
  message: string;
}

export default class MyApp extends React.Component<Props, State> {
  state: State;

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
          Hello Magic Script
        </Text>
      </View>
    );
  }
}
