import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import {
  applyMove,
  getCurrentPlayer,
  initGame,
  prepareMoveState,
} from '../game/rules';
import type { GameState, Move, Player } from '../game/model';
import type { PlayerConfig } from './Home';

interface GamePageProps {
  players: PlayerConfig[];
  onReset: () => void;
}

function formatPos(pos: Move['from']): string {
  if (pos.kind === 'yard') return 'yard';
  if (pos.kind === 'track') return `track ${pos.index}`;
  return `home ${pos.index}`;
}

function GamePage({ players, onReset }: GamePageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const playerModels = useMemo<Player[]>(
    () => players.map((player) => ({ color: player.color, kind: player.type })),
    [players],
  );

  const [state, setState] = useState<GameState>(() => initGame(playerModels));
  const [message, setMessage] = useState<string>('Roll to start');

  useEffect(() => {
    setState(initGame(playerModels));
    setMessage('Roll to start');
  }, [playerModels]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f1f3f5';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#2b2d42';
    context.font = 'bold 24px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Board Placeholder', canvas.width / 2, canvas.height / 2);
  }, [state]);

  const currentPlayer = getCurrentPlayer(state);

  const handleRoll = () => {
    if (state.phase !== 'WAIT_ROLL') return;
    if (state.players.length === 0) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    const nextState = prepareMoveState(state, roll);

    if (nextState.legalMoves.length === 0) {
      const nextTurn = roll === 6 ? state.turnIndex : (state.turnIndex + 1) % state.players.length;
      setState({
        ...state,
        turnIndex: nextTurn,
        phase: 'WAIT_ROLL',
        lastRoll: undefined,
        legalMoves: [],
      });
      setMessage(`Rolled ${roll} but no moves; passing turn.`);
      return;
    }

    setState(nextState);
    setMessage(`Rolled ${roll}. Choose a move.`);
  };

  const handleMove = (move: Move) => {
    const updated = applyMove(state, move);
    setState(updated);
    setMessage('Move applied. Roll again.');
  };

  const pieceSummary = state.players.flatMap((player) =>
    state.pieces[player.color].map((piece) => ({
      id: piece.id,
      color: player.color,
      pos: piece.pos,
    })),
  );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Game</h2>
          <p>Basic turn loop with a placeholder board.</p>
        </div>
        <button type="button" className="secondary" onClick={onReset}>
          Back to Home
        </button>
      </div>

      <div className="game-controls">
        <div>
          <p>Current player: <strong>{currentPlayer.color}</strong></p>
          {state.lastRoll && <p>Last roll: {state.lastRoll}</p>}
          <p className="status-text">{message}</p>
        </div>
        <button
          type="button"
          className="primary"
          onClick={handleRoll}
          disabled={state.phase !== 'WAIT_ROLL' || state.players.length === 0}
        >
          Roll Dice
        </button>
      </div>

      <div className="board-wrapper">
        <canvas ref={canvasRef} width={640} height={640} />
      </div>

      <div className="move-list">
        <h3>Legal Moves</h3>
        {state.legalMoves.length === 0 ? (
          <p className="status-text">Roll the dice to see available moves.</p>
        ) : (
          <ul>
            {state.legalMoves.map((move) => (
              <li key={move.pieceId}>
                <button type="button" onClick={() => handleMove(move)}>
                  {move.pieceId}: {formatPos(move.from)} → {formatPos(move.to)}{' '}
                  {move.capture ? `(capture ${move.capture.pieceId})` : ''}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="player-summary">
        {pieceSummary.map((piece) => (
          <div key={piece.id} className="player-pill" style={{ '--pill-color': piece.color } as React.CSSProperties}>
            <span className="color" aria-hidden />
            <span>{piece.id}</span>
            <small>{formatPos(piece.pos)}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export default GamePage;
