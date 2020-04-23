import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Video } from 'src/components/Video/Video';


type Props = {
  stream: MediaStream;
  title?: string;
};

export const VideoChat:React.FunctionComponent<Props> = (props) => {
  // const [ localStream, setLocalStream ] = useState<MediaStream | null>(null);
  // const [ remoteStream, setRemoteStream ] = useState<MediaStream | null>(null);

  // useEffect(() => {
  //   (() => {
  //     // const rtc = WebRTC.start();

  //     const destroyOnLocalStreamListener = props.rtc.onLocalStreamStart((stream) => {
  //       // console.log()
  //       console.log('local stream starting', stream);
  //       setLocalStream(stream);
  //     });

  //     const destroyOnRemoteStreamListener = props.rtc.onRemoteStreamStart((stream) => {
  //       console.log('on remote stream started', stream);
  //       setRemoteStream(stream);
  //     })

  //     return () => {
  //       destroyOnLocalStreamListener();
  //       destroyOnRemoteStreamListener();
  //     }

  //     // setVideoSrc(stream);

  //     // var binaryData = [];
  //     // binaryData.push(stream);

  //     // console.log('stream starting', stream);
  //   })();
  // }, []);

  return (
    <>
      <Text>{props.title}</Text>
      <Video
        srcObject={props.stream}
        rate={1.0}
        volume={1.0}
        isMuted={true}
        resizeMode="cover"
        shouldPlay
        style={{ width: 300, height: 300 }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {},
});
