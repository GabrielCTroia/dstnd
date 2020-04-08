import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebRTCInit } from 'src/services/webrtc';
import { s } from 'src/services/s';


// console.log(WebRTCInit);

export default function App() {
  useEffect(() => {
    s();
    WebRTCInit();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app works!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
