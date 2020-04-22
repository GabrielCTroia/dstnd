import { Peer } from 'src/records/Peer';

export type SignalingMessage = {
  peer_address: string;
} & (
  | SignalingMessageWithDescription 
  | SignalingMessageWithCandidate
);

export type SignalingMessageWithDescription = {
  desc: RTCSessionDescription;
  candidate?: null;
};

export type SignalingMessageWithCandidate = {
  candidate: RTCIceCandidate;
  desc?: null;
};

export interface SignalingChannel {
  send(forward: {[k: string]: unknown}): void;

  onmessage: ((msg: SignalingMessage) => void) | null;
}