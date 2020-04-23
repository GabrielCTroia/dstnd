import { isLeft } from 'fp-ts/lib/Either';
import {
  PeerNetworkRefreshPayload,
  wsMessageRecord,
  WebRtcNegotationPayload,
  JoinRoomPayloadRecord,
} from './records/SignalingPayload';
import { SignalingChannel, SignalingMessage } from './SignallingChannel';


export class WssSignalingChannel implements SignalingChannel {
  public connection: WebSocket;

  onmessage = (_: SignalingMessage) => {};

  onPeerStatusUpdate?: (p: PeerNetworkRefreshPayload) => void;

  isOpen: boolean = false;

  constructor(private url: string) {
    this.connection = new WebSocket(url);

    this.connection.addEventListener('message', (event) => {
      console.log('WssSignalingChannel.message', event.data);
      
      const payload = JSON.parse(event.data);
      const result = wsMessageRecord.decode(payload);

      if (isLeft(result)) {
        return;
      }

      if (result.right.msg_type === 'webrtc_negotiation') {
        const msg = result.right;

        // TODO: Use io-ts
        const payload = JSON.parse(msg.content.forward) as SignalingMessage;

        this.onmessage({
          // peer_address: msg.content.peer_address,
          ...payload,
        });
      } 
      else if (result.right.msg_type === 'peer_network_refresh') {
        const msg = result.right;

        console.log('msg', msg);

        this.onPeerStatusUpdate?.(msg);
      }
    });
  }

  send(forward: {[k: string]: unknown}) {
    const payload: WebRtcNegotationPayload = {
      msg_type: 'webrtc_negotiation',
      content: {
        forward: JSON.stringify(forward),
      },
    };
    
    const msg = JSON.stringify(payload);

    this.connection.send(msg);
  }

  close() {
    this.connection.close();
  }

  // TODO: This could be split into a different handler since it's not really part of the signaling channel
  //  but it just so happens to work over the same protocol/connection
  joinRoom(roomId: string) {
    const payload: JoinRoomPayloadRecord = {
      msg_type: 'join_room',
      content: {
        room_id: roomId,
      },
    }

    const str = JSON.stringify(payload);

    console.log('join room msg', str);

    this.connection.send(str);
}
}