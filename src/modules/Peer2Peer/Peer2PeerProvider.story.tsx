import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { Peer2PeerProvider } from './Peer2PeerProvider';
import { Text, TouchableOpacity, View } from 'react-native';


storiesOf('Peer2Peer', module)
  .add('default', () => (
    <Peer2PeerProvider
      wssUrl="ws://127.0.0.1:7777/ws"
      iceServersURLs={[
        'stun:stun.ideasip.com',
      ]}
      render={({ p2p, peerStatus }) => (
        <>
          {console.log('peer status', peerStatus)}
          <TouchableOpacity onPress={p2p.start}>
            <Text>Start P2P</Text>
          </TouchableOpacity>
          <Text>Peer Count: {peerStatus.count}</Text>
          <Text>Peers: {peerStatus.peers.map((peer) => (
            <View key={peer}>
              <Text>{peer}, </Text>
            </View>
          ))}</Text>
        </>
      )}
    />
  ))