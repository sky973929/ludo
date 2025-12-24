export type Color = 'red' | 'green' | 'yellow' | 'blue';

export type YardPos = { kind: 'yard' };
export type TrackPos = { kind: 'track'; index: number };
export type HomePos = { kind: 'home'; index: number };

export type Pos = YardPos | TrackPos | HomePos;

export interface Piece {
  id: string;
  color: Color;
  pos: Pos;
}

export interface Player {
  color: Color;
  kind: 'human' | 'ai';
}

export type Phase = 'WAIT_ROLL' | 'WAIT_MOVE';

export interface Move {
  pieceId: string;
  from: Pos;
  to: Pos;
  capture?: { color: Color; pieceId: string };
}

export interface GameState {
  players: Player[];
  pieces: Record<Color, Piece[]>;
  turnIndex: number;
  phase: Phase;
  lastRoll?: number;
  legalMoves: Move[];
}
