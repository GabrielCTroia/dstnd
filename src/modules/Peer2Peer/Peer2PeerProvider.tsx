import React, { ReactNode } from 'react';
import { Peer2Peer } from 'src/services/peer2peer';
import { PeerNetworkRefreshPayload, RoomRecord } from 'src/services/peer2peer/records/SignalingPayload';


type Props = {
  wssUrl: string;
  iceServersURLs: string[]; 
  render: (p: {
    // p2p: Peer2Peer,
    joinRoom: (id: string) => void;
    start: () => void;
    peerStatus: PeerNetworkRefreshPayload['content'],
    isConnectionReady: boolean;
    localStream?: MediaStream;
    remoteStreams?: MediaStream[];
  }) => ReactNode;
};

type State = {
  isConnectionReady: boolean;
  peerStatus: PeerNetworkRefreshPayload['content'];
  joinedRoom?: RoomRecord;
  localStream?: MediaStream;
  remoteStreams?: MediaStream[];
}

export class Peer2PeerProvider extends React.Component<Props, State> {
  private p2p?: Peer2Peer;
  
  private unsubscribFromOnReadyStateChange?: () => void;
  private unsubscribeFromOnPeerStatusUpdate?: () => void; 
  private unsubscribeFromLocalStreamStart?: () => void;
  private unsubscribeFromRemoteStreamStart?: () => void;

  state: State = {
    isConnectionReady: false,
    peerStatus: {
      peers: {},
      count: 0,
      all_rooms: {},
      joined_room: null,
    },
    localStream: undefined,
    remoteStreams: undefined,
  }

  componentDidMount() {
    this.p2p = new Peer2Peer({
      socketUrl: this.props.wssUrl,
      iceServers: [{
        urls: this.props.iceServersURLs,
      }]
    });

    this.unsubscribFromOnReadyStateChange = this.p2p.onReadyStateChange(
      (isConnectionReady) => {
        this.setState({ isConnectionReady });
      },
    );

    this.unsubscribeFromOnPeerStatusUpdate = this.p2p.onPeerStatusUpdate(
      (peerStatus) => {
        this.setState((prevState) => ({
          ...prevState,
          peerStatus,
        }));
      }
    )

    this.unsubscribeFromLocalStreamStart = this.p2p.onLocalStreamStart(
      (localStream) => {
        this.setState((prevState) => ({
          ...prevState,
          localStream,
        }));
      }
    );

    this.unsubscribeFromRemoteStreamStart = this.p2p.onRemoteStreamStart(
      (remoteStream) => {
        this.setState((prevState) => ({
          ...prevState,
          // TODO: Not Sure how to do multiple remote streams
          remoteStreams: [remoteStream],
        }));
      }
    );
  }

  // TODO: Test this
  componentWillUnmount() {
    this.p2p?.close();
    this.unsubscribFromOnReadyStateChange?.();
    this.unsubscribeFromOnPeerStatusUpdate?.();
    this.unsubscribeFromLocalStreamStart?.();
    this.unsubscribeFromRemoteStreamStart?.();
  }

  render() {
    if (!this.p2p) {
      return null;
    }

    return (
      <>
        {this.props.render({
          // p2p: this.p2p,
          joinRoom: (id: string) => {
            this.p2p?.joinRoom(id);
          },
          start: () => {
            if (!this.state.peerStatus.joined_room) {
              throw new Error('Peer2Peer Error: Cannot run start before joinging a room!');
            }

            this.p2p?.start();
          },
          peerStatus: this.state.peerStatus,
          isConnectionReady: this.state.isConnectionReady,

          localStream: this.state.localStream,
          remoteStreams: this.state.remoteStreams,
        })}
      </>
    );
  }
}
