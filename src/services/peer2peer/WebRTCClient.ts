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

  private localStreamingStarted = false;

  private peerConnections: {
    [peerId: string]: RTCPeerConnection;
  } = {};

  private streamingConstraints = {
    audio: true,
    video: true,
  };

  constructor(
    private iceServers: RTCIceServer[],
    private signalingChannel: SignalingChannel
  ) {}

  private onicecandidate(peerId: string, { candidate }: RTCPeerConnectionIceEvent) {
    this.signalingChannel.send({ candidate });
  }

  private async onnegotiationneeded(peerId: string) {
    try {
      const connection = this.peerConnections[peerId];

      await connection.setLocalDescription(
        await connection.createOffer()
      );
      // send the offer to the other peer
      this.signalingChannel.send({ desc: connection.localDescription });
    } catch (err) {
      // TODO: Does this need to be part of logic?
      console.error("WebRTCClient Negotiation Error", err);
    }
  }

  private ontrack(peerId: string, event: RTCTrackEvent) {
    PubSub.publish(
      WebRTCClient.PUBSUB_CHANNELS.onRemoteStream,
      event.streams[0],
    );
  }

  private async onmessage(peerId: string, msg: SignalingMessage) {
    // TODO: Type this using io-ts
    try {
      const connection = this.peerConnections[peerId];

      if (msg.desc) {
        // if we get an offer, we need to reply with an answer
        if (msg.desc.type === "offer") {
          this.onSignallingOffer(peerId, msg);
        } else if (msg.desc.type === "answer") {
          this.onSignalingAnswer(connection, msg);
        } else {
          console.log("Unsupported SDP type.", msg.desc);
        }
      } else if (msg.candidate) {
        this.onSignalingCandidate(connection, msg);
      }
    } catch (err) {
      console.error("Signaling onmessage Error", err);
    }
  }

  private async onSignallingOffer(
    peerId: string,
    msg: SignalingMessageWithDescription,
  ) {
    const connection = this.peerConnections[peerId];

    console.log('WebRTC.onSignalingOffer', msg);
    await connection.setRemoteDescription(msg.desc);

    const localStream = await this.getLocalStream();

    localStream
      .getTracks()
      .forEach((track) => {
        // Send the Stram to the given Peer
        this.peerConnections[peerId].addTrack(track, localStream);
      });

    this.startLocalStreaming(localStream);
  
    await connection.setLocalDescription(
      await connection.createAnswer()
    );

    this.signalingChannel.send({ desc: connection.localDescription });
  }

  private async onSignalingAnswer(
    connection: RTCPeerConnection,
    msg: SignalingMessageWithDescription,
  ) {
    console.log('WebRTC.onSignalingAnswer', msg);
    await connection.setRemoteDescription(msg.desc);
  }

  private async onSignalingCandidate(
    connection: RTCPeerConnection,
    msg: SignalingMessageWithCandidate,
  ) {
    console.log('WebRTC.onSignalingCandidate', msg);
    await connection.addIceCandidate(msg.candidate);
  }

  private localStream?: MediaStream;
  private async getLocalStream() {
    if (this.localStream) {
      return this.localStream;
    }

    this.localStream = await navigator.mediaDevices.getUserMedia(this.streamingConstraints);

    return this.localStream;
  }

  startLocalStreaming(stream: MediaStream) {
    if (this.localStreamingStarted) {
      return false;
    }

    PubSub.publish(WebRTCClient.PUBSUB_CHANNELS.onLocalStream, stream);

    this.localStreamingStarted = true;
  }

  stopLocalStreaming(stream: MediaStream) {
    // TBD
  }

  async startStreaming() {
    try {
      // get local stream, show it in self-view and add it to be sent
      const localStream = await this.getLocalStream();

      // Stream to all connected peers
      localStream
        .getTracks()
        .forEach((track) => Object.keys(this.peerConnections)
          .forEach((peerId) => {
            this.peerConnections[peerId].addTrack(track, localStream);
          }
        ));

      this.startLocalStreaming(localStream);
    } catch (err) {
      console.error(err);
    }
  }

  close() {
    Object.keys(this.peerConnections).forEach((id) => {
      this.peerConnections[id].close();
    });
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

  addPeer(peerId: string) {
    if (this.peerConnections[peerId]) {
      console.log('WebRTCClient.addPeer() Attempted to add an existent peer');
      return;
    }

    this.peerConnections[peerId] = new RTCPeerConnection({ iceServers: this.iceServers });

    this.peerConnections[peerId].onicecandidate = (event) => this.onicecandidate(peerId, event);
    this.peerConnections[peerId].onnegotiationneeded = () => this.onnegotiationneeded(peerId);
    this.peerConnections[peerId].ontrack = (event) => this.ontrack(peerId, event);
    this.signalingChannel.onmessage = (msg) => this.onmessage(peerId, msg);
  }

  removePeer(id: string) {
    
  }
}
