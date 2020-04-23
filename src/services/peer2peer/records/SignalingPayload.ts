import * as io from 'io-ts';


export const connectionOpenedPayload = io.type({
  msg_type: io.literal('connection_opened'),
  content: io.type({
    my_address: io.string,
  }),
});

export const roomRecord = io.type({
  id: io.string,
  peers: io.record(io.string, io.null),
});

export const peerNetworkRefreshPayload = io.type({
  msg_type: io.literal('peer_network_refresh'),
  content: io.type({
    count: io.number,
    peers: io.record(io.string, io.string),
    all_rooms: io.record(io.string, io.null),
    joined_room: io.union([roomRecord, io.null]),
  }),
});

export const webRtcNegotationPayload = io.type({
  msg_type: io.literal('webrtc_negotiation'),
  content: io.type({
    forward: io.string,
  }),
});

export const joinRoomPayload = io.type({
  msg_type: io.literal('join_room'),
  content: io.type({
    room_id: io.string,
  }),
});

export const wsMessageRecord = io.union([
  connectionOpenedPayload,
  peerNetworkRefreshPayload,
  webRtcNegotationPayload,
  joinRoomPayload,
]);

export type PeerNetworkRefreshPayload = io.TypeOf<typeof peerNetworkRefreshPayload>;
export type WebRtcNegotationPayload = io.TypeOf<typeof webRtcNegotationPayload>;
export type JoinRoomPayloadRecord = io.TypeOf<typeof joinRoomPayload>;
export type RoomRecord = io.TypeOf<typeof roomRecord>;

export type SignalingPayloadRecord = io.TypeOf<typeof wsMessageRecord>;

