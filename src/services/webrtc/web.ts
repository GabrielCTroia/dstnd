import PubSub from 'pubsub-js';
import { SignalingChannel, SignalingMessage } from './SignallingChannel';
import { Peer } from 'src/records/Peer';


export const getWebRTC = (signaling: SignalingChannel) => {
  var peer: Peer;
  var started = false;

  const PUBSUB_CHANNELS = {
    onLocalStream: 'ON_LOCAL_STREAM',
    onRemoteStream: 'ON_REMOTE_STREAM',
  }

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

    return signaling.send(peer, { candidate });
  }

  // let the "negotiationneeded" event trigger offer generation
  pc.onnegotiationneeded = async () => {
    // console.log('WEB RTC STEP: onnegotiationneeded');

    try {
      await pc.setLocalDescription(await pc.createOffer());
      // send the offer to the other peer
      signaling.send(peer, { desc: pc.localDescription });
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
    // start(peer);
  };

  // call start() to initiate
  async function start(p: Peer) {
    // if (started) {
    //   // Don't start it multiple times. Not sure how this will play with other threads
    //   return;
    // }
    console.log('starting WEB RTC', p, signaling);

    // Set the peer glboally, b/c I don't know of another safer way to do it now!
    peer = p;

    try {
      // get local stream, show it in self-view and add it to be sent
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // console.log('starting', stream);

      // REMOVED
      // selfView.srcObject = stream;

      PubSub.publish(PUBSUB_CHANNELS.onLocalStream, stream);

      // return stream;
      started = true;

    } catch (err) {
      console.error(err);
    }
  }

  signaling.onmessage = async (msg: SignalingMessage) => {
    console.log('Web onmessage', msg);

    // Anytime there is an on message replace the global peer so it can be accesible in all the other listeners
    // This isn't good but I don't know how to do it another way.
    // TODO: One proble mthat can occur right away is with some other peer contacting it!
    peer = {
      // This is the from peer
      address: msg.peer_address,
    }

    // Type this using io-ts
    try {
      if (msg.desc) {
        // if we get an offer, we need to reply with an answer
        if (msg.desc.type === 'offer') {
          await pc.setRemoteDescription(msg.desc);
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          await pc.setLocalDescription(await pc.createAnswer());

          signaling.send(peer, { desc: pc.localDescription });
        } else if (msg.desc.type === 'answer') {
          await pc.setRemoteDescription(msg.desc);
        } else {
          console.log('Unsupported SDP type.', msg.desc);
        }
      } else if (msg.candidate) {
        await pc.addIceCandidate(msg.candidate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const instance = {
    start: (peer: Peer) => {
      start(peer);

      return instance;
    },
    close: (peer: Peer) => {
      // add ability to close a connection. I believe it's worth having it?
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

  return instance;
};

export type WebRTC = ReturnType<typeof getWebRTC>;