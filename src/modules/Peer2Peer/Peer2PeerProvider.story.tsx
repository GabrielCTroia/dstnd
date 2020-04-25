import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { Peer2PeerProvider } from './Peer2PeerProvider';
import { Text, TouchableOpacity, View, Button } from 'react-native';
import { VideoChat } from '../VideoChat';


storiesOf('Peer2Peer', module)
  .add('default', () => (
    <Peer2PeerProvider
      wssUrl="ws://127.0.0.1:7777"
      iceServersURLs={[
        'stun:stun.ideasip.com',
      ]}
      render={({ joinRoom, start, stop, peerStatus, localStream, remoteStreams }) => (
        <>
          {peerStatus.joined_room 
          ? (
            <View>
              <Text>Me: {peerStatus.me}</Text>
              <Text>Room Joined {peerStatus.joined_room.id}</Text>
              <Text>Room Peer Count: {Object.keys(peerStatus.joined_room.peers).length}</Text>
              <Text>Room Peers Online: {Object.keys(peerStatus.joined_room.peers).map((peer) => (
                  <View key={peer}>
                    <Text>{peer}, </Text>
                  </View>
                ))}
              </Text>
              <View style={{
                display: 'flex',
                flexDirection: 'row',
              }}>
                {localStream 
                  ? (
                    <Button
                      title="Stop Chat"
                      onPress={stop}
                      color="red"
                    />
                  ) 
                  : (
                    <Button
                      title="Start Chat"
                      onPress={start}
                    />
                  )
                }
              </View>
                {localStream && (
                  <View style={{
                    height: 200,
                    display: 'flex',
                    flexDirection: 'row',
                    marginBottom: 60,
                  }}>
                    <VideoChat
                      title={peerStatus.me}
                      stream={localStream}
                    />
                </View>
              )}
              <View style={{
                height: 200,
                display: 'flex',
                flexDirection: 'row',
              }}>
                {Object.values(remoteStreams || {}).map(({peerId, stream}) => (
                  <VideoChat
                    key={peerId}
                    title={peerId}
                    stream={stream}
                  />
                ))}
              </View>
            </View>
          ) : (
            <>
              {console.log('peer status', peerStatus)}
              {/* <TouchableOpacity onPress={() => joinRoom()}>
                <Text>Start P2P</Text> */}
              {/* </TouchableOpacity> */}
              <Text>Me: {peerStatus.me}</Text>
              <Text>All Peer Count: {peerStatus.count}</Text>
              <Text>All Peers Online: {Object.keys(peerStatus.peers).map((peer) => (
                  <View key={peer}>
                    <Text>{peer}, </Text>
                  </View>
                ))}
              </Text>
              <View style={{ display: 'flex' }}>
                <Text>Rooms:</Text>
                {Object.keys(peerStatus.all_rooms).map((room) => (
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                    }}
                    key={room}
                  >
                    <Button
                      title={`Join ${room} Room`}
                      onPress={() => joinRoom(room)}
                      color="orange"
                    />
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    />
  ))