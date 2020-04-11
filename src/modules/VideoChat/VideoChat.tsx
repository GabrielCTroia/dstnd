import React, {useState, useEffect} from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebRTC } from 'src/services/webrtc/web';
import { Video } from 'src/components/Video/Video';


type Props = {
  rtc: WebRTC,
};

export const VideoChat:React.FunctionComponent<Props> = (props) => {
  const [ localStream, setLocalStream ] = useState<MediaStream | null>(null);
  const [ remoteStream, setRemoteStream ] = useState<MediaStream | null>(null);

  useEffect(() => {
    (() => {
      // const rtc = WebRTC.start();

      const destroyOnLocalStreamListener = props.rtc.onLocalStreamStart((stream) => {
        // console.log()
        console.log('local stream starting', stream);
        setLocalStream(stream);
      });

      const destroyOnRemoteStreamListener = props.rtc.onRemoteStreamStart((stream) => {
        console.log('on remote stream started', stream);
        setRemoteStream(stream);
      })

      return () => {
        destroyOnLocalStreamListener();
        destroyOnRemoteStreamListener();
      }

      // setVideoSrc(stream);

      // var binaryData = [];
      // binaryData.push(stream);

      // console.log('stream starting', stream);
    })();
  }, []);

  return (
    <>
    {localStream && (
      <>
        <Text>Local Stream</Text>
        <Video
          srcObject={localStream}
          rate={1.0}
          volume={1.0}
          isMuted={true}
          resizeMode="cover"
          shouldPlay
          style={{ width: 300, height: 300 }}
        />
      </>
    )}

    {remoteStream && (
      <>
        <Text>Remote Stream</Text>
        <Video
          srcObject={remoteStream}
          rate={1.0}
          volume={1.0}
          isMuted={true}
          resizeMode="cover"
          shouldPlay
          style={{ width: 300, height: 300 }}
        />
      </>
    )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {},
});
