import { SignalingChannel, SignalingMessage } from '../webrtc/SignallingChannel';
import { Peer } from 'src/records/Peer';
import { wsMessageRecord, P2PCommunicationMessageRecord } from 'src/records/WSMessage';
import { isRight } from 'fp-ts/lib/Either';


export class WebRTCSignallingChannelThroughWebSocket implements SignalingChannel {
  onmessage = (_: SignalingMessage) => {};

  constructor(private socketConnection: WebSocket) {
    console.log('constructing the web rtc socket channel');
    // socketConnection.addEventListener('message', () => {
    //   console.log('App 3');
    // });

    socketConnection.addEventListener('message', (event) => {
      console.log('Message received Signalling Channel Handler', event.data);
      
      const payload = JSON.parse(event.data);
      const result = wsMessageRecord.decode(payload);


      if (isRight(result) && result.right.msg_type === 'p2p_communication') {
        const msg = result.right;

        // TODO: Use io-ts
        const payload = JSON.parse(msg.content.forward) as SignalingMessage;

        this.onmessage({
          peer_address: msg.content.peer_address,
          ...payload,
        });
      }
    });
  }

  send(peer: Peer, forward: {[k: string]: unknown}) {
    const payload: P2PCommunicationMessageRecord = {
      msg_type: 'p2p_communication',
      content: {
        peer_address: peer.address,
        forward: JSON.stringify(forward),
      },
    };
    
    const msg = JSON.stringify(payload);

    console.log('WebRTCSginalling Channel send', msg)

    this.socketConnection.send(msg);
  }
}