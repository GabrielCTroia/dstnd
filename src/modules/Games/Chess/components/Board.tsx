/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import Chessboard from 'chessboardjsx';


type Props = Chessboard['props'];

export class Board extends React.Component<Props> {
  render() {
    if (Platform.OS !== 'web') {
      return (
        <View>
          <Text>The chessboard only works on the web</Text>
        </View>
      )
    }

    return (
      <Chessboard  {...this.props}/>
    );
  }
}

