import * as io from 'io-ts';

const WSConnectionLifecycleMessage = io.type({
  message_type: io.keyof({
    'connection_opened': null,
    'connection_closed': null,
  }),
  content: io.type({
    address: io.string,
    peers_count: io.number,
    peers_active: io.record(io.string, io.string),
  }),
});

const WSPeerCallMessage = io.type({
  message_type: io.literal('peer_call'),
  content: io.type({
    peer_address: io.string,
  }),
})

export const wsMessageRecord = io.union([WSConnectionLifecycleMessage, WSPeerCallMessage]);

export type WSMessageRecord = io.TypeOf<typeof wsMessageRecord>;
