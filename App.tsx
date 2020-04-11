import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebSocketProvider } from 'src/services/websocket';
import { Lobby } from 'src/modules/Lobby';
import { Peer } from 'src/records/Peer';
import { range } from 'src/lib/util';
import { wsMessageRecord } from 'src/records/WSMessage';
import { fold, left } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { VideoChat } from 'src/modules/VideoChat';

type CallingPeer = {
  calling: false;
} | {
  calling: true;
  peer: Peer;
}

export default function App() {
  const [me, setMe] = useState<null | string>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peerIsCalling, setPeerIsCalling] = useState<CallingPeer>({ calling: false });
  // const [peersCount, setPeersCount] = useState(0);

  return (
    <View style={styles.container}>
      <WebSocketProvider 
        // url="ws://127.0.0.1:7777/ws"
        url="wss://b16fc48c.ngrok.io/ws"
        onMessage={(e) => {
          // console.log('Message received', e);

          const payload = JSON.parse(e.data);
          const result = wsMessageRecord.decode(payload);
          console.log('Msg received App', payload);

          pipe(
            result, 
            fold(
              (e) => {
                console.log(PathReporter.report(left(e)));
              }, 
              (payload) => {
                switch (payload.msg_type) {
                  case 'connection_opened': 
                    setMe(payload.content.my_address);

                    break;
                  case 'peer_network_refresh': 
                    const peers = Object.values(payload.content.peers).map((p) => ({
                      address: String(p),
                    }));

                    setPeers(peers);

                    break;
                  // case 'peer_call':
                  //   setPeerIsCalling({
                  //     calling: true,
                  //     peer: {
                  //       address: payload.content.peer_address,
                  //     }
                  //   });
                  //   break;
                  default:
                    // console.log('WebSocket received an unhandled message', payload);
                    break;
                }
              }
            ));
          
        }}
        onOpen={() => {
          console.log('WS connection opened');
        }}
        onClose={(e) => {
          console.log('WS connection closed', e);
        }}
        onError={(e) => {
          console.log('WS connection error', e);
        }}
        render={({ sendMessage, startP2P, rtc }) => (
          <>
            <View style={{
              paddingVertical: 20,
            }}>
              <Text>Me: {me}</Text>
            </View>
            {
              peerIsCalling.calling && (
                <View style={{
                  backgroundColor: 'red',
                }}>
                  <Text>Peer {peerIsCalling.peer.address} is calling you</Text>
                </View>
              ) 
            }
            
            {me && (
              <Lobby
                me={me}
                peers={peers}
                onPeerPress={(peer) => startP2P(peer)}
              />
            )}

            <VideoChat rtc={rtc} />
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
