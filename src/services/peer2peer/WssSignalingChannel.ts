import { SignalingChannel, SignalingMessage } from './SignallingChannel';
import { wsMessageRecord, P2PCommunicationMessageRecord } from 'src/records/WSMessage';
import { isRight, isLeft } from 'fp-ts/lib/Either';
import { PeerNetworkRefreshPayload } from './records/SignalingPayload';


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

      if (result.right.msg_type === 'p2p_communication') {
        const msg = result.right;

        // TODO: Use io-ts
        const payload = JSON.parse(msg.content.forward) as SignalingMessage;

        this.onmessage({
          peer_address: msg.content.peer_address,
          ...payload,
        });
      } 
      else if (result.right.msg_type === 'peer_network_refresh') {
        const msg = result.right;

        this.onPeerStatusUpdate?.(msg);
      }
    });
  }

  send(forward: {[k: string]: unknown}) {
    const payload: P2PCommunicationMessageRecord = {
      msg_type: 'p2p_communication',
      content: {
        peer_address: 'fake address', // take out
        forward: JSON.stringify(forward),
      },
    };
    
    const msg = JSON.stringify(payload);

    console.log('WssSignalingChannel.send', msg)

    this.connection.send(msg);
  }

  close() {
    this.connection.close();
  }
}