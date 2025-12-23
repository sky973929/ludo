import { Color, GameState, Move, Piece, Player, Pos } from './model';
import { advance, isSafeTrack, isTrack } from './board';

const PIECES_PER_COLOR = 4;

function createPieces(color: Color): Piece[] {
  return Array.from({ length: PIECES_PER_COLOR }, (_, i) => ({
    id: `${color}-${i + 1}`,
    color,
    pos: { kind: 'yard' } as Pos,
  }));
}

export function initGame(players: Player[]): GameState {
  const pieces = players.reduce<Record<Color, Piece[]>>((acc, player) => {
    acc[player.color] = createPieces(player.color);
    return acc;
  }, {
    red: [],
    green: [],
    yellow: [],
    blue: [],
  });

  return {
    players,
    pieces,
    turnIndex: 0,
    phase: 'WAIT_ROLL',
    legalMoves: [],
  } satisfies GameState;
}

export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.turnIndex % state.players.length];
}

function findPiece(state: GameState, color: Color, id: string): Piece | undefined {
  return state.pieces[color].find((piece) => piece.id === id);
}

function findCapture(state: GameState, landing: Pos, moverColor: Color): Move['capture'] {
  if (!isTrack(landing)) return undefined;
  if (isSafeTrack(landing.index)) return undefined;

  for (const player of state.players) {
    if (player.color === moverColor) continue;
    const opponent = state.pieces[player.color].find(
      (piece) => isTrack(piece.pos) && piece.pos.index === landing.index,
    );
    if (opponent) {
      return { color: opponent.color, pieceId: opponent.id };
    }
  }
  return undefined;
}

export function getLegalMoves(state: GameState, roll: number): Move[] {
  if (state.phase !== 'WAIT_ROLL') {
    throw new Error('Cannot roll in current phase');
  }

  const player = getCurrentPlayer(state);
  const moves: Move[] = [];

  for (const piece of state.pieces[player.color]) {
    const nextPos = advance(player.color, piece.pos, roll);
    if (!nextPos) continue;

    const capture = findCapture(state, nextPos, player.color);
    moves.push({
      pieceId: piece.id,
      from: piece.pos,
      to: nextPos,
      capture,
    });
  }

  return moves;
}

export function applyMove(state: GameState, move: Move): GameState {
  if (state.phase !== 'WAIT_MOVE') {
    throw new Error('Not ready to apply move');
  }

  const player = getCurrentPlayer(state);
  const piece = findPiece(state, player.color, move.pieceId);
  if (!piece) {
    throw new Error('Piece not found');
  }

  const updatedPieces: Record<Color, Piece[]> = { ...state.pieces };
  updatedPieces[player.color] = state.pieces[player.color].map((p) =>
    p.id === piece.id ? { ...p, pos: move.to } : p,
  );

  if (move.capture) {
    const { color, pieceId } = move.capture;
    updatedPieces[color] = state.pieces[color].map((p) =>
      p.id === pieceId ? { ...p, pos: { kind: 'yard' } } : p,
    );
  }

  const shouldRepeat = state.lastRoll === 6;
  const nextTurnIndex = shouldRepeat ? state.turnIndex : (state.turnIndex + 1) % state.players.length;

  return {
    ...state,
    pieces: updatedPieces,
    turnIndex: nextTurnIndex,
    phase: 'WAIT_ROLL',
    lastRoll: undefined,
    legalMoves: [],
  } satisfies GameState;
}

export function prepareMoveState(state: GameState, roll: number): GameState {
  const legalMoves = getLegalMoves(state, roll);
  return {
    ...state,
    phase: 'WAIT_MOVE',
    lastRoll: roll,
    legalMoves,
  } satisfies GameState;
}
