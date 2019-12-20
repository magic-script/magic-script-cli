//
import React from 'react';
import { View, Text } from 'magic-script-components';

export default class MyApp extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      message: props.message
    };
  }

  render () {
    return (
      <View name="main-view">
        <Text textSize={0.1} localPosition={[-0.3, 0, 0]}>
          Hello Magic Script
        </Text>
      </View>
    );
  }
}
