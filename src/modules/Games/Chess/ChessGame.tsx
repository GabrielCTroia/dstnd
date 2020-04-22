import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Board } from './components/Board';
import { getNewChessGame } from './lib/sdk';


type Props = {
  myColor: 'white' | 'black';
  allowSinglePlayerPlay?: boolean;
  onMove?: (fen: string) => void;
  fen?: string;
};

type GameState = {
  fen: string,
}

export const ChessGame:React.FunctionComponent<Props> = ({
  myColor,
  onMove = () => {},
  fen,
  allowSinglePlayerPlay = true,
}) => {
  const [gameState, setGameState] = useState<GameState>({ fen: fen || 'start' });
  const game = useRef(getNewChessGame()).current;

  // Update the state from the prop
  // In the future, the state could only be set from outside - thinki of a case where 
  //  the "fen" comes from a server like lichess.org
  useEffect(() => {
    if (fen) {
      setGameState((prevState) => ({
        ...prevState,
        fen,
      }));
    }
  }, [fen])

  useEffect(() => {
    onMove(gameState.fen);
  }, [gameState]);
  

  return (
    <View style={styles.container}>
      <Board 
        position={gameState.fen}
        allowDrag={(p) => allowSinglePlayerPlay || p.piece.slice(0, 1) === myColor.slice(0, 1)}
        onDrop={({ sourceSquare, targetSquare }) => {
          // see if the move is legal
          let validMove = game.move({
            from: sourceSquare,
            to: targetSquare,
          });

          if (validMove === null) {
            return;
          }
      
          setGameState((prevState) => ({
            ...prevState,
            fen: game.fen(),
          }));
        }}
      />      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
