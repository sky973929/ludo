import { useEffect, useMemo, useRef } from 'react';
import { HOME_LEN, SAFE_TRACK_INDEXES, START_INDEX, TRACK_LEN } from '../../game/board';
import type { GameState, Move, Piece } from '../../game/model';
import { homeXY, posToXY, trackXY, yardXY } from './geometry';

interface BoardCanvasProps {
  state: GameState;
  onPickMove: (move: Move) => void;
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
const PIECE_OFFSETS: { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 7, y: 0 },
  { x: -7, y: 0 },
  { x: 0, y: 7 },
  { x: 0, y: -7 },
  { x: 7, y: 7 },
  { x: -7, y: -7 },
  { x: 7, y: -7 },
  { x: -7, y: 7 },
];

type PieceDraw = {
  piece: Piece;
  moves: Move[];
  x: number;
  y: number;
};

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

  const pieceDraws = useMemo(() => {
    const groups = new Map<
      string,
      { base: { x: number; y: number }; items: { piece: Piece; moves: Move[] }[] }
    >();

    for (const player of state.players) {
      for (const piece of state.pieces[player.color]) {
        const parsed = parseInt(piece.id.split('-')[1], 10) - 1;
        const slot = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(3, parsed));
        const posWithColor = {
          ...piece.pos,
          color: piece.color,
          slot,
        } as Piece['pos'] & {
          color: typeof player.color;
          slot: number;
        };
        const base = posToXY(posWithColor, width, height);
        const keyParts =
          piece.pos.kind === 'track'
            ? ['track', piece.pos.index]
            : piece.pos.kind === 'home'
              ? ['home', piece.color, piece.pos.index]
              : ['yard', piece.color];
        const key = keyParts.join(':');
        const entry = groups.get(key);
        if (entry) {
          entry.items.push({ piece, moves: legalByPiece[piece.id] ?? [] });
        } else {
          groups.set(key, {
            base,
            items: [{ piece, moves: legalByPiece[piece.id] ?? [] }],
          });
        }
      }
    }

    const draws: PieceDraw[] = [];
    for (const { base, items } of groups.values()) {
      items.forEach((item, index) => {
        const offset = PIECE_OFFSETS[index % PIECE_OFFSETS.length];
        draws.push({
          ...item,
          x: base.x + offset.x,
          y: base.y + offset.y,
        });
      });
    }
    return draws;
  }, [height, legalByPiece, state.pieces, state.players, width]);

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
    for (const draw of pieceDraws) {
      const highlight = draw.moves.length ? '#0ea5e9' : undefined;
      drawCircle(
        ctx,
        draw.x,
        draw.y,
        PIECE_RADIUS,
        COLOR_MAP[draw.piece.color],
        highlight,
        highlight ? 3 : 2,
      );
    }
  }, [height, pieceDraws, width]);

  const handleClick: React.MouseEventHandler<HTMLCanvasElement> = (event) => {
    if (state.phase !== 'WAIT_MOVE' || state.legalMoves.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    for (const draw of pieceDraws) {
      const dist = Math.hypot(draw.x - x, draw.y - y);
      if (dist <= PIECE_RADIUS + 2) {
        const captureMove = draw.moves.find((m) => m.capture);
        onPickMove(captureMove ?? draw.moves[0]);
        return;
      }
    }
  };

  return <canvas ref={canvasRef} width={width} height={height} onClick={handleClick} />;
}

export default BoardCanvas;
