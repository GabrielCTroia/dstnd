import { isLeft } from 'fp-ts/lib/Either';
import {
  PeerNetworkRefreshPayload,
  wsMessageRecord,
  WebRtcNegotationPayload,
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
      const payload = JSON.parse(event.data);
      const result = wsMessageRecord.decode(payload);

      if (isLeft(result)) {
        return;
      }

      if (result.right.msg_type === 'webrtc_negotiation') {
        this.onmessage(JSON.parse(result.right.content.forward));
      } 
      else if (result.right.msg_type === 'peer_network_refresh') {
        this.onPeerStatusUpdate?.(result.right);
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
}