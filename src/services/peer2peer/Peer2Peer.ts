import { WssSignalingChannel } from './WssSignalingChannel';
import { WebRTCClient } from './WebRTCClient';
import PubSub from 'pubsub-js';
import { PeerNetworkRefreshPayload } from './records/SignalingPayload';


export class Peer2Peer {
  static PUBSUB_CHANNELS = {
    onReadyStateChange: 'ON_READY_STATE_CHANGE',
    onPeerStatusUpdate: 'ON_PEER_STATUS_UPDATE',
  }

  private signal: WssSignalingChannel;
  private rtc: WebRTCClient;

  start: typeof WebRTCClient.prototype.start;
  onLocalStreamStart: typeof WebRTCClient.prototype.onLocalStreamStart;
  onRemoteStreamStart: typeof WebRTCClient.prototype.onRemoteStreamStart;
  onData: typeof WebRTCClient.prototype.onData;

  constructor(config: {
    socketUrl: string,
    iceServers: RTCIceServer[],
  }) {
    this.signal = new WssSignalingChannel(config.socketUrl);
    
    this.rtc = new WebRTCClient(config.iceServers, this.signal);

    this.start = this.rtc.start.bind(this.rtc);
    this.onLocalStreamStart = this.rtc.onLocalStreamStart.bind(this.rtc);
    this.onRemoteStreamStart = this.rtc.onRemoteStreamStart.bind(this.rtc)
    this.onData = this.rtc.onData.bind(this.rtc);

    this.signal.connection.onopen = () => {
      PubSub.publish(Peer2Peer.PUBSUB_CHANNELS.onReadyStateChange, true);
    }

    this.signal.connection.onclose = () => {
      PubSub.publish(Peer2Peer.PUBSUB_CHANNELS.onReadyStateChange, false);
    }

    this.signal.onPeerStatusUpdate = (status) => {
      PubSub.publish(Peer2Peer.PUBSUB_CHANNELS.onPeerStatusUpdate, status.content);
    }

    // this.signal.onmessage = (msg) => {
    //   console.log('new msg', msg);
    // }

    // this.signal.onPeerStatusUpdate()
  }

  joinRoom(roomId: string) {
    this.signal.joinRoom(roomId);
  }

  // send = (signal: WssSignalingChannel) => {
  //   const oldSend = signal.send;

  //   // signal.send = (...args) => {
  //   //   oldSend(...args);
  //   // }
  //   Object.assign
  // }

  

  close() {
    this.rtc.close();
    this.signal.close();
  }

  onReadyStateChange(fn: (ready: boolean) => void) {
    const token = PubSub.subscribe(
      Peer2Peer.PUBSUB_CHANNELS.onReadyStateChange,
      (_: string, value: boolean) => fn(value),
    );

    // unsubscribe
    return () => {
      PubSub.unsubscribe(token);
    }
  }

  onPeerStatusUpdate(fn: (status: PeerNetworkRefreshPayload['content']) => void) {
    const token = PubSub.subscribe(
      Peer2Peer.PUBSUB_CHANNELS.onPeerStatusUpdate,
      (_: string, value: PeerNetworkRefreshPayload['content']) => fn(value),
    );

    return () => {
      PubSub.unsubscribe(token);
    }
  }
}