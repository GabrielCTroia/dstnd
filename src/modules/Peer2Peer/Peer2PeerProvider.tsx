import React, { ReactNode } from 'react';
import { Peer2Peer } from 'src/services/peer2peer';
import { Text } from 'react-native';


type Props = {
  wssUrl: string;
  iceServersURLs: string[]; 
  render: (p: {
    p2p: Peer2Peer,
    peerStatus: {
      count: number;
      peers: string[];
    },
    isConnectionReady: boolean;
  }) => ReactNode;
};

type State = {
  isConnectionReady: boolean;
  peersCount: number;
  peers: string[];
}

export class Peer2PeerProvider extends React.Component<Props, State> {
  private p2p?: Peer2Peer;
  
  private unsubscribFromOnReadyStateChange?: () => void;
  private unsubscribeFromOnPeerStatusUpdate?: () => void; 

  state: State = {
    isConnectionReady: false,
    peersCount: 0,
    peers: [],
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
      ({ count, peers }) => {
        this.setState({
          peersCount: count,
          peers: Object.values(peers),
        })
      }
    )
  }

  // TODO: Test this
  componentWillUnmount() {
    this.p2p?.close();
    this.unsubscribFromOnReadyStateChange?.();
    this.unsubscribeFromOnPeerStatusUpdate?.();
  }

  render() {
    if (!this.p2p) {
      return null;
    }

    return (
      <>
        {this.props.render({
          p2p: this.p2p,
          peerStatus: {
            count: this.state.peersCount,
            peers: this.state.peers,
          },
          isConnectionReady: this.state.isConnectionReady,
        })}
      </>
    );
  }
}
