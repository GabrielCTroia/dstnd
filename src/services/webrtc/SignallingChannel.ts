import { Peer } from 'src/records/Peer';

export type SignalingMessage = {
  peer_address: string;
} & (
  {
    desc: RTCSessionDescription;
    candidate?: null;
  } | {
    candidate: RTCIceCandidate;
    desc?: null;
  }
);

export interface SignalingChannel {
  send(peer: Peer, forward: {[k: string]: unknown}): void;

  onmessage: ((msg: SignalingMessage) => void) | null;
}