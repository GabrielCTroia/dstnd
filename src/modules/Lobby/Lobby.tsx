import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { Peer } from 'src/records/Peer';

type Props = {
  me: string;
  peers: Peer[];
  onCall: (peer: Peer) => void;
};

export const Lobby:React.FunctionComponent<Props> = (props) => {
  return (
    <View style={styles.container}>
      <Text>{props.peers.length} Active Peers</Text>
      {props.peers.map((peer) => (
        <View key={peer.address}>
          <Button 
            title={`Ring ${peer.address}`}
            onPress={() => props.onCall(peer)}
            disabled={peer.address === props.me}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
