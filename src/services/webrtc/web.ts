import PubSub from 'pubsub-js';
import { StrictMode } from 'react';


export const WebRTC = (() => {

  const PUBSUB_CHANNELS = {
    onLocalStream: 'ON_LOCAL_STREAM',
    onRemoteStream: 'ON_REMOTE_STREAM',
  }

  // handles JSON.stringify/parse
  // const signaling = new SignalingChannel();
  const signaling: {
    send: (...args: any[]) => any,
    onmessage?: (...args: any[]) => any,
  } = {
    send: (...args: any[]) => {},
    onmessage: () => {},
  };
  const constraints = {
    audio: true,
    video: true,
  };
  const configuration = {iceServers: [{
    // urls: 'stun.ideasip.com'
    // urls: 'stun:stun.l.google.com:19302'
    urls: ['stun:stun.ideasip.com'],
  }]};
  const pc = new RTCPeerConnection(configuration);

  // send any ice candidates to the other peer
  pc.onicecandidate = ({ candidate }) => {
    console.log('WEB RTC STEP: onicecandidate', candidate);

    return signaling.send({candidate});
  }

  // let the "negotiationneeded" event trigger offer generation
  pc.onnegotiationneeded = async () => {
    console.log('WEB RTC STEP: onnegotiationneeded');

    try {
      await pc.setLocalDescription(await pc.createOffer());
      // send the offer to the other peer
      signaling.send({
        desc: pc.localDescription,
      });
    } catch (err) {
      console.error('Negotiation Error', err);
    }
  };

  // once remote track media arrives, show it in remote video element
  pc.ontrack = (event) => {
    console.log('REMOTE MEDIA ARRIVED', event);
    // don't set srcObject again if it is already set.

    // REMOVED
    // if (remoteView.srcObject) return;
    // remoteView.srcObject = event.streams[0];

    PubSub.publish(PUBSUB_CHANNELS.onRemoteStream, event.streams[0]);
  };

  // call start() to initiate
  async function start() {
    try {
      // get local stream, show it in self-view and add it to be sent
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // console.log('starting', stream);

      // REMOVED
      // selfView.srcObject = stream;

      PubSub.publish(PUBSUB_CHANNELS.onLocalStream, stream);

      // return stream;

    } catch (err) {
      console.error(err);
    }
  }

  signaling.onmessage = async (params) => {
    console.log('Signaling on message', params);

    const { desc, candidate } = params;

    try {
      if (desc) {
        // if we get an offer, we need to reply with an answer
        if (desc.type === 'offer') {
          await pc.setRemoteDescription(desc);
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          await pc.setLocalDescription(await pc.createAnswer());
          signaling.send({desc: pc.localDescription});
        } else if (desc.type === 'answer') {
          await pc.setRemoteDescription(desc);
        } else {
          console.log('Unsupported SDP type.', desc);
        }
      } else if (candidate) {
        await pc.addIceCandidate(candidate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rtc = {
    start: () => {
      start();

      return rtc;
    },
    onLocalStreamStart: (fn: (stream: MediaStream) => void) => {
      PubSub.subscribe(PUBSUB_CHANNELS.onLocalStream, (topic: string, stream: MediaStream) => fn(stream));

      return () => {
        PubSub.unsubscribe(PUBSUB_CHANNELS.onLocalStream);
      }
    },
    onRemoteStreamStart: (fn: (stream: MediaStream) => void) => {
      PubSub.subscribe(PUBSUB_CHANNELS.onRemoteStream, (topic: string, stream: MediaStream) => fn(stream));

      return () => {
        PubSub.unsubscribe(PUBSUB_CHANNELS.onRemoteStream);
      }
    }
  };

  return rtc;
})();