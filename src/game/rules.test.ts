import { describe, expect, it } from 'vitest';
import { getLegalMoves, initGame } from './rules';
import { START_INDEX } from './board';
import type { GameState, Move, Pos } from './model';

function firstMove(moves: Move[]): Move {
  const [move] = moves;
  if (!move) throw new Error('No moves');
  return move;
}

function setPiecePos(state: GameState, color: 'red' | 'green', index: number, pos: Pos): GameState {
  return {
    ...state,
    pieces: {
      ...state.pieces,
      [color]: state.pieces[color].map((piece, i) => (i === index ? { ...piece, pos } : piece)),
    },
  };
}

describe('ludo rules', () => {
  it('does not allow leaving yard without a roll of six', () => {
    const state = initGame([{ color: 'red', kind: 'human' }]);
    const moves = getLegalMoves(state, 3);
    expect(moves).toHaveLength(0);
  });

  it('allows entering the track on a roll of six', () => {
    const state = initGame([{ color: 'red', kind: 'human' }]);
    const moves = getLegalMoves(state, 6);
    expect(moves).toHaveLength(4);
    const move = firstMove(moves);
    expect(move.to).toEqual({ kind: 'track', index: START_INDEX.red });
  });

  it('captures opponent on non-safe track squares', () => {
    let state = initGame([
      { color: 'red', kind: 'human' },
      { color: 'green', kind: 'human' },
    ]);

    state = setPiecePos(state, 'red', 0, { kind: 'track', index: START_INDEX.red });
    state = setPiecePos(state, 'green', 0, { kind: 'track', index: START_INDEX.red + 2 });

    const moves = getLegalMoves(state, 2);
    const move = firstMove(moves);
    expect(move.capture).toMatchObject({ color: 'green' });
  });
});
