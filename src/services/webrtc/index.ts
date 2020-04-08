import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals
} from 'react-native-webrtc';

const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
const pc = new RTCPeerConnection(configuration);

console.log('WEBRTC', pc);

let isFront = true;


export const WebRTCInit = () => {
  mediaDevices.enumerateDevices().then(sourceInfos => {
    console.log(sourceInfos);
    let videoSourceId;
    for (let i = 0; i < sourceInfos.length; i++) {
      const sourceInfo = sourceInfos[i];
      if(sourceInfo.kind == "videoinput" && sourceInfo.facing == (isFront ? "front" : "environment")) {
        videoSourceId = sourceInfo.deviceId;
      }
    }

    mediaDevices.getUserMedia({
      audio: true,
      video: {
        mandatory: {
          minWidth: 500, // Provide your own width, height and frame rate here
          minHeight: 300,
          minFrameRate: 30
        },
        facingMode: (isFront ? "user" : "environment"),
        optional: (videoSourceId ? [{sourceId: videoSourceId}] : [])
      }
    })
    .then(stream => {
      console.log('WEBRTC: Got Stream', stream);
      // Got stream!
    })
    .catch(error => {
      console.log('WEBRTC: Got Stream Eror', error);
      // Log error
    });
  });

  pc.createOffer().then(desc => {
    pc.setLocalDescription(desc).then(() => {
      // Send pc.localDescription to peer
    });
  });

  pc.onicecandidate = function (event) {
    // send event.candidate to peer
  };

  // also support setRemoteDescription, createAnswer, addIceCandidate, onnegotiationneeded, oniceconnectionstatechange, onsignalingstatechange, 

}