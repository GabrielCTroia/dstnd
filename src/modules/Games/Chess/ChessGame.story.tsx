import React, { useState, useEffect } from 'react';
import { storiesOf } from '@storybook/react-native';
import { ChessGame } from './ChessGame';
import { ChessInstance } from 'chess.js';
import { getNewChessGame } from './lib/sdk';


const randomPlay = (
  chess: ChessInstance,
  onChange: (fen: string) => void = () => {},
  speed = 1000,
  ) => {
  if (!chess.game_over()) {
    const moves = chess.moves()
    const move = moves[Math.floor(Math.random() * moves.length)]
    chess.move(move)

    onChange(chess.fen());

    setTimeout(() => randomPlay(chess, onChange), speed);
  }
}

storiesOf('Chess', module)
  .add('default', () => (
    <ChessGame myColor="white" />
  ))
  .add('as black', () => (
    <ChessGame myColor="black" />
  ))
  .add('with logging on move', () => (
    <ChessGame 
      myColor="black"
      onMove={(fen) => {
        console.log('Moved', fen);
      }}
    />
  ))
  .add('with started game', () => (
    <ChessGame 
      myColor="black"
      fen="rnb1kbnr/ppp1pppp/3q4/3p4/4PP2/2N5/PPPP2PP/R1BQKBNR b KQkq - 2 3"
    />
  ))
  .add('Demo Random Game (not optimized)', () => React.createElement(() => {
    const [gameState, setGameState] = useState({ fen: '' });

    useEffect(() => {
      const game = getNewChessGame();

      randomPlay(game, () => {
        setGameState((prevState) => ({ 
          ...prevState, 
          fen: game.fen(),
        }));
      }, 3 * 1000);
    }, []);

    return (
      <ChessGame 
        myColor="white"
        fen={gameState.fen}
      />
    )}
  ));