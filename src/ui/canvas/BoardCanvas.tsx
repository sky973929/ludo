import { useEffect, useMemo, useRef } from 'react';
import { HOME_LEN, SAFE_TRACK_INDEXES, START_INDEX, TRACK_LEN } from '../../game/board';
import type { GameState, Move, Piece } from '../../game/model';
import { homeXY, posToXY, trackXY, yardXY } from './geometry';

interface BoardCanvasProps {
  state: GameState;
  onPickMove?: (move: Move) => void;
  width?: number;
  height?: number;
}

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
};

const PIECE_RADIUS = 14;

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke?: string,
  strokeWidth = 2,
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function findPieceById(pieces: Record<string, Piece[]>, id: string): Piece | undefined {
  for (const arr of Object.values(pieces)) {
    const found = arr.find((p) => p.id === id);
    if (found) return found;
  }
  return undefined;
}

export function BoardCanvas({ state, onPickMove, width = 640, height = 640 }: BoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const legalByPiece = useMemo(() => {
    const entries = state.legalMoves.reduce<Record<string, Move[]>>((acc, move) => {
      if (!acc[move.pieceId]) acc[move.pieceId] = [];
      acc[move.pieceId].push(move);
      return acc;
    }, {});
    return entries;
  }, [state.legalMoves]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Track background
    for (let i = 0; i < TRACK_LEN; i += 1) {
      const { x, y } = trackXY(i, canvas.width, canvas.height);
      const isSafe = SAFE_TRACK_INDEXES.includes(i);
      drawCircle(ctx, x, y, 8, isSafe ? '#cbd5e1' : '#e2e8f0', '#94a3b8');
    }

    // Home tracks
    for (const color of Object.keys(START_INDEX)) {
      for (let i = 0; i < HOME_LEN; i += 1) {
        const { x, y } = homeXY(color as keyof typeof START_INDEX, i, canvas.width, canvas.height);
        drawCircle(ctx, x, y, 8, `${COLOR_MAP[color]}33`, COLOR_MAP[color]);
      }
    }

    // Yard markers
    for (const color of Object.keys(START_INDEX)) {
      for (let k = 0; k < 4; k += 1) {
        const { x, y } = yardXY(color as keyof typeof START_INDEX, k, canvas.width, canvas.height);
        drawCircle(ctx, x, y, 6, `${COLOR_MAP[color]}22`, '#cbd5e1');
      }
    }

    // Pieces
    for (const player of state.players) {
      for (const piece of state.pieces[player.color]) {
        const parsed = parseInt(piece.id.split('-')[1], 10) - 1;
        const slot = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(3, parsed));
        const posWithColor = { ...piece.pos, color: piece.color, slot } as Piece['pos'] & {
          color: typeof player.color;
          slot: number;
        };
        const { x, y } = posToXY(posWithColor, canvas.width, canvas.height);
        const highlight = legalByPiece[piece.id]?.length ? '#0ea5e9' : undefined;
        drawCircle(ctx, x, y, PIECE_RADIUS, COLOR_MAP[piece.color], highlight, highlight ? 3 : 2);
      }
    }
  }, [height, legalByPiece, state.pieces, state.players, width]);

  const handleClick: React.MouseEventHandler<HTMLCanvasElement> = (event) => {
    if (!onPickMove || state.phase !== 'WAIT_MOVE' || state.legalMoves.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const piecesWithMoves = Object.keys(legalByPiece).map((id) => {
      const piece = findPieceById(state.pieces, id);
      return piece ? { piece, moves: legalByPiece[id] } : null;
    }).filter(Boolean) as { piece: Piece; moves: Move[] }[];

    for (const { piece, moves } of piecesWithMoves) {
      const parsed = parseInt(piece.id.split('-')[1], 10) - 1;
      const slot = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(3, parsed));
      const posWithColor = { ...piece.pos, color: piece.color, slot } as Piece['pos'] & {
        color: typeof piece.color;
        slot: number;
      };
      const { x: px, y: py } = posToXY(posWithColor, canvas.width, canvas.height);
      const dist = Math.hypot(px - x, py - y);
      if (dist <= PIECE_RADIUS + 2) {
        const captureMove = moves.find((m) => m.capture);
        onPickMove(captureMove ?? moves[0]);
        return;
      }
    }
  };

  return <canvas ref={canvasRef} width={width} height={height} onClick={handleClick} />;
}

export default BoardCanvas;
