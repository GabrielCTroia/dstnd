import * as io from 'io-ts';

const ConnectionOpened = io.type({
  msg_type: io.literal('connection_opened'),
  content: io.type({
    my_address: io.string,
  }),
});

const PeerNetworkRefresh = io.type({
  msg_type: io.literal('peer_network_refresh'),
  content: io.type({
    count: io.number,
    peers: io.record(io.string, io.string),
  }),
});

const PeerCall = io.type({
  msg_type: io.literal('peer_call'),
  content: io.type({
    peer_address: io.string,
  }),
});

const P2PCommunication = io.type({
  msg_type: io.literal('p2p_communication'),
  content: io.type({
    peer_address: io.string,
    forward: io.string,
  }),
});

export const wsMessageRecord = io.union([
  ConnectionOpened,
  PeerNetworkRefresh,
  PeerCall,
  P2PCommunication,
]);

export type WSMessageRecord = io.TypeOf<typeof wsMessageRecord>;

export type P2PCommunicationMessageRecord = io.TypeOf<typeof P2PCommunication>;