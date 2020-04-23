import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { Peer2PeerProvider } from './Peer2PeerProvider';
import { Text, TouchableOpacity, View, Button } from 'react-native';
import { VideoChat } from '../VideoChat';


storiesOf('Peer2Peer', module)
  .add('default', () => (
    <Peer2PeerProvider
      wssUrl="ws://127.0.0.1:7777/ws"
      iceServersURLs={[
        'stun:stun.ideasip.com',
      ]}
      render={({ joinRoom, start, peerStatus, localStream, remoteStreams }) => (
        <>
          {peerStatus.joined_room 
          ? (
            <View>
              <Text>Room Joined {peerStatus.joined_room.id}</Text>
              <Text>Room Peer Count: {Object.keys(peerStatus.joined_room.peers).length}</Text>
              <Text>Room Peers Online: {Object.keys(peerStatus.joined_room.peers).map((peer) => (
                  <View key={peer}>
                    <Text>{peer}, </Text>
                  </View>
                ))}
              </Text>
              <Button 
                title="Start Chat"
                onPress={start}
              />
              {localStream && (
                <VideoChat 
                  title="Local" 
                  stream={localStream}
                />
              )}
              {remoteStreams?.map((stream, index) => (
                <VideoChat 
                  key={index}
                  title={`Remote ${index}`}
                  stream={stream}
                />
              ))}
            </View>
          ) : (
            <>
              {console.log('peer status', peerStatus)}
              {/* <TouchableOpacity onPress={() => joinRoom()}>
                <Text>Start P2P</Text> */}
              {/* </TouchableOpacity> */}
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
                  <Button 
                    key={room}
                    title={`Join ${room} Room`}
                    onPress={() => joinRoom(room)}
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}
    />
  ))