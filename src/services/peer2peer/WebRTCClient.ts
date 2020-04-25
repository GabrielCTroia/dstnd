import {
  SignalingChannel,
  SignalingMessage,
  SignalingMessageWithDescription,
  SignalingMessageWithCandidate,
} from './SignallingChannel';
import PubSub from 'pubsub-js';



// @Deprecated in favor of WebRTCRemote Connection
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
      {
        peerId,
        stream: event.streams[0],
      }
    );
  }

  private async onmessage(peerId: string, msg: SignalingMessage) {
    // TODO: Type this using io-ts
    try {
      if (msg.desc) {
        // if we get an offer, we need to reply with an answer
        if (msg.desc.type === "offer") {
          this.onSignallingOffer(peerId, msg);
        } else if (msg.desc.type === "answer") {
          this.onSignalingAnswer(peerId, msg);
        } else {
          console.log("Unsupported SDP type.", msg.desc);
        }
      } else if (msg.candidate) {
        this.onSignalingCandidate(peerId, msg);
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

    this.notifyLocalStreamingStarted(localStream);
  
    await connection.setLocalDescription(
      await connection.createAnswer()
    );

    this.signalingChannel.send({ desc: connection.localDescription });
  }

  private async onSignalingAnswer(
    peerId: string,
    msg: SignalingMessageWithDescription,
  ) {
    const connection = this.peerConnections[peerId];

    console.log('WebRTC.onSignalingAnswer', msg);
    await connection.setRemoteDescription(msg.desc);
  }

  private async onSignalingCandidate(
    peerId: string,
    msg: SignalingMessageWithCandidate,
  ) {
    const connection = this.peerConnections[peerId];

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

  notifyLocalStreamingStarted(stream: MediaStream) {
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

      this.notifyLocalStreamingStarted(localStream);
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

  onRemoteStreamStart(fn: (peerId: string, stream: MediaStream) => void) {
    const token = PubSub.subscribe(
      WebRTCClient.PUBSUB_CHANNELS.onRemoteStream, 
      (
        _: string, 
        { peerId, stream }: { peerId: string, stream: MediaStream },
      ) => fn(peerId, stream),
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
      console.error('WebRTCClient.addPeer() Attempted to add an existent peer', peerId, this.peerConnections);
      return;
    }

    this.peerConnections[peerId] = new RTCPeerConnection({ iceServers: this.iceServers });

    this.peerConnections[peerId].onicecandidate = (event) => this.onicecandidate(peerId, event);
    this.peerConnections[peerId].onnegotiationneeded = () => this.onnegotiationneeded(peerId);
    this.peerConnections[peerId].ontrack = (event) => this.ontrack(peerId, event);
    this.signalingChannel.onmessage = (msg) => this.onmessage(peerId, msg);

    console.log(`WebRTCClient.addPeer() ${peerId} added succesfully.`, this.peerConnections);
  }

  removePeer(id: string) {
    // TBD
  }
}
