import { START_INDEX, TRACK_LEN } from '../../game/board';
import type { Color, Pos, TrackPos, HomePos, YardPos } from '../../game/model';

export type Point = { x: number; y: number };

const TRACK_RADIUS_FACTOR = 0.35;
const HOME_STEP_FACTOR = 0.04;
const YARD_OFFSET_FACTOR = 0.2;
const YARD_SPREAD_FACTOR = 0.06;

function angleForTrack(index: number): number {
  // start at the top (-90deg) and go clockwise
  return (index / TRACK_LEN) * Math.PI * 2 - Math.PI / 2;
}

function colorAngle(color: Color): number {
  return angleForTrack(START_INDEX[color]);
}

export function trackXY(index: number, width: number, height: number): Point {
  const radius = Math.min(width, height) * TRACK_RADIUS_FACTOR;
  const cx = width / 2;
  const cy = height / 2;
  const angle = angleForTrack(index);
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

export function homeXY(color: Color, i: number, width: number, height: number): Point {
  const baseRadius = Math.min(width, height) * TRACK_RADIUS_FACTOR;
  const step = Math.min(width, height) * HOME_STEP_FACTOR;
  const radius = baseRadius - step * (i + 1);
  const angle = colorAngle(color);
  const cx = width / 2;
  const cy = height / 2;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

export function yardXY(color: Color, k: number, width: number, height: number): Point {
  const offset = Math.min(width, height) * YARD_OFFSET_FACTOR;
  const spread = Math.min(width, height) * YARD_SPREAD_FACTOR;
  const cx = width / 2;
  const cy = height / 2;

  const base: Point = (() => {
    switch (color) {
      case 'red':
        return { x: cx - offset, y: cy - offset };
      case 'green':
        return { x: cx + offset, y: cy - offset };
      case 'yellow':
        return { x: cx + offset, y: cy + offset };
      case 'blue':
      default:
        return { x: cx - offset, y: cy + offset };
    }
  })();

  const row = Math.floor(k / 2);
  const col = k % 2;
  return { x: base.x + (col === 0 ? -spread : spread), y: base.y + (row === 0 ? -spread : spread) };
}

export function posToXY(pos: Pos & { color?: Color; slot?: number }, width: number, height: number): Point {
  if (pos.kind === 'track') {
    return trackXY((pos as TrackPos).index, width, height);
  }
  const color = pos.color;
  if (!color) {
    throw new Error('Color is required to map home or yard positions');
  }
  if (pos.kind === 'home') {
    return homeXY(color, (pos as HomePos).index, width, height);
  }
  const slot = (pos as YardPos & { slot?: number }).slot ?? 0;
  return yardXY(color, slot, width, height);
}
