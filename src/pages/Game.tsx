import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { applyMove, getCurrentPlayer, initGame, prepareMoveState } from '../game/rules';
import type { GameState, Move, Player } from '../game/model';
import type { PlayerConfig } from './Home';
import BoardCanvas from '../ui/canvas/BoardCanvas';

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
  const playerModels = useMemo<Player[]>(
    () => players.map((player) => ({ color: player.color, kind: player.type })),
    [players],
  );

  const [state, setState] = useState<GameState>(() => initGame(playerModels));
  const [message, setMessage] = useState<string>('Roll to start');
  const [showDebug, setShowDebug] = useState<boolean>(false);

  useEffect(() => {
    setState(initGame(playerModels));
    setMessage('Roll to start');
  }, [playerModels]);

  const currentPlayer = getCurrentPlayer(state);

  const handleRoll = () => {
    setState((prev) => {
      if (prev.phase !== 'WAIT_ROLL' || prev.players.length === 0) return prev;
      const roll = Math.floor(Math.random() * 6) + 1;
      const nextState = prepareMoveState(prev, roll);

      if (nextState.legalMoves.length === 0) {
        const nextTurn = (prev.turnIndex + 1) % prev.players.length;
        setMessage(`Rolled ${roll} but no moves; passing turn.`);
        return {
          ...prev,
          turnIndex: nextTurn,
          phase: 'WAIT_ROLL',
          lastRoll: undefined,
          legalMoves: [],
        } satisfies GameState;
      }

      setMessage(`Rolled ${roll}. Choose a move.`);
      return nextState;
    });
  };

  useEffect(() => {
    if (state.phase === 'WAIT_MOVE' && state.legalMoves.length === 0) {
      setState((prev) => {
        if (prev.phase !== 'WAIT_MOVE' || prev.legalMoves.length !== 0 || prev.players.length === 0) {
          return prev;
        }
        const nextTurn = (prev.turnIndex + 1) % prev.players.length;
        setMessage('No moves available; passing turn.');
        return {
          ...prev,
          turnIndex: nextTurn,
          phase: 'WAIT_ROLL',
          lastRoll: undefined,
          legalMoves: [],
        } satisfies GameState;
      });
    }
  }, [state.phase, state.legalMoves.length, state.lastRoll, state.players.length]);

  const handleMove = (move: Move) => {
    setState((prev) => {
      if (prev.phase !== 'WAIT_MOVE') return prev;
      const updated = applyMove(prev, move);
      setMessage('Move applied. Roll again.');
      return updated;
    });
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
          <p>Roll, click a highlighted piece, and advance the turn loop.</p>
        </div>
        <button type="button" className="secondary" onClick={onReset}>
          Back to Home
        </button>
      </div>

      <div className="game-controls">
        <div>
          <p>
            Current player: <strong>{currentPlayer.color}</strong>
          </p>
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
        <BoardCanvas state={state} onPickMove={handleMove} />
      </div>

      <details className="move-list" open={showDebug} onToggle={(e) => setShowDebug((e.target as HTMLDetailsElement).open)}>
        <summary className="debug-summary">Debug: Legal Moves</summary>
        {state.legalMoves.length === 0 ? (
          <p className="status-text">Roll the dice to see available moves.</p>
        ) : (
          <ul>
            {state.legalMoves.map((move) => (
              <li key={`${move.pieceId}-${formatPos(move.from)}`}>
                <button type="button" onClick={() => handleMove(move)}>
                  {move.pieceId}: {formatPos(move.from)} → {formatPos(move.to)}{' '}
                  {move.capture ? `(capture ${move.capture.pieceId})` : ''}
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>

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
