import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Video } from 'src/components/Video/Video';


type Props = {
  stream: MediaStream;
  title?: string;
};

export const VideoChat:React.FunctionComponent<Props> = (props) => {
  return (
    <View style={styles.container}>
      <Text>{props.title}</Text>
      <Video
        srcObject={props.stream}
        rate={1.0}
        volume={1.0}
        isMuted={true}
        resizeMode="cover"
        shouldPlay
        style={{ width: 300 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
  },
});
