import React from 'react';

export default class MyApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = { counter: props.counter, message: props.message };
  }

  render() {
    return (
      <view name='main-view'>
        <text localPosition={[-0.5, -0.1, 0]} textSize={0.10} >{this.state.message}</text>
      </view>
    );
  }
}
