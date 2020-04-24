import {
  SignalingChannel,
  SignalingMessage,
  SignalingMessageWithDescription,
  SignalingMessageWithCandidate,
} from './SignallingChannel';
import PubSub from 'pubsub-js';


export class WebRTCClient {
  static PUBSUB_CHANNELS = {
    onLocalStream: 'ON_LOCAL_STREAM',
    onRemoteStream: 'ON_REMOTE_STREAM',
  }

  private started = false

  private connection: RTCPeerConnection;

  private streamingConstraints = {
    audio: true,
    video: true,
  };

  constructor(
    iceServers: RTCIceServer[],
    private signalingChannel: SignalingChannel
  ) {
    this.connection = new RTCPeerConnection({ iceServers });

    this.connection.onicecandidate = this.onicecandidate.bind(this);
    this.connection.onnegotiationneeded = this.onnegotiationneeded.bind(this);
    this.connection.ontrack = this.ontrack.bind(this);
    this.signalingChannel.onmessage = this.onmessage.bind(this);
  }

  private onicecandidate({ candidate }: RTCPeerConnectionIceEvent) {
    this.signalingChannel.send({ candidate });
  }

  private async onnegotiationneeded() {
    try {
      await this.connection.setLocalDescription(
        await this.connection.createOffer()
      );
      // send the offer to the other peer
      this.signalingChannel.send({ desc: this.connection.localDescription });
    } catch (err) {
      // TODO: Does this need to be part of logic?
      console.error("WebRTCClient Negotiation Error", err);
    }
  }

  private ontrack(event: RTCTrackEvent) {
    PubSub.publish(
      WebRTCClient.PUBSUB_CHANNELS.onRemoteStream,
      event.streams[0],
    );
  }

  private async onmessage(msg: SignalingMessage) {
    // TODO: Type this using io-ts
    try {
      if (msg.desc) {
        // if we get an offer, we need to reply with an answer
        if (msg.desc.type === "offer") {
          this.onSignallingOffer(msg);
        } else if (msg.desc.type === "answer") {
          this.onSignalingAnswer(msg);
        } else {
          console.log("Unsupported SDP type.", msg.desc);
        }
      } else if (msg.candidate) {
        this.onSignalingCandidate(msg);
      }
    } catch (err) {
      console.error("Signaling onmessage Error", err);
    }
  }

  private async onSignallingOffer(msg: SignalingMessageWithDescription) {
    console.log('WebRTC.onSignalingOffer', msg);
    await this.connection.setRemoteDescription(msg.desc);

    this.startStreaming();

    await this.connection.setLocalDescription(
      await this.connection.createAnswer()
    );

    this.signalingChannel.send({ desc: this.connection.localDescription });
  }

  private async onSignalingAnswer(msg: SignalingMessageWithDescription) {
    console.log('WebRTC.onSignalingAnswer', msg);
    await this.connection.setRemoteDescription(msg.desc);
  }

  private async onSignalingCandidate(msg: SignalingMessageWithCandidate) {
    console.log('WebRTC.onSignalingCandidate', msg);
    await this.connection.addIceCandidate(msg.candidate);
  }

  async startStreaming() {
    // Don't start it multiple times.
    if (this.started) {
      return;
    }

    try {
      // get local stream, show it in self-view and add it to be sent
      const stream = await navigator.mediaDevices.getUserMedia(this.streamingConstraints);

      stream.getTracks().forEach((track) => this.connection.addTrack(track, stream));

      PubSub.publish(WebRTCClient.PUBSUB_CHANNELS.onLocalStream, stream);

      this.started = true;
    } catch (err) {
      console.error(err);
    }
  }

  close() {
    this.connection.close();
  }

  onLocalStreamStart(fn: (stream: MediaStream) => void) {
    const token = PubSub.subscribe(
      WebRTCClient.PUBSUB_CHANNELS.onLocalStream, 
      (_: string, stream: MediaStream) => fn(stream),
    );

    // unsubscriber
    return () => {
      PubSub.unsubscribe(token);
    }
  }

  onRemoteStreamStart(fn: (stream: MediaStream) => void) {
    const token = PubSub.subscribe(
      WebRTCClient.PUBSUB_CHANNELS.onRemoteStream, 
      (_: string, stream: MediaStream) => fn(stream)
    );

    // unsubscriber
    return () => {
      PubSub.unsubscribe(token);
    }
  }

  onData(fn: () => void) {
    // TODO
  }
}
