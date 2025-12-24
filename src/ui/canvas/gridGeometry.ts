export type Cell = { r: number; c: number };

export function cellToXY(
  cell: Cell,
  width: number,
  height: number,
): { x: number; y: number; size: number; ox: number; oy: number } {
  const size = Math.min(width, height) / 15;
  const x = cell.c * size;
  const y = cell.r * size;
  const ox = x + size / 2;
  const oy = y + size / 2;
  return { x, y, size, ox, oy };
}

export const TRACK_CELLS: Cell[] = [];
export const HOME_CELLS: Record<'red' | 'green' | 'yellow' | 'blue', Cell[]> = {
  red: [],
  green: [],
  yellow: [],
  blue: [],
};
export const YARD_CELLS: Record<'red' | 'green' | 'yellow' | 'blue', Cell[]> = {
  red: [],
  green: [],
  yellow: [],
  blue: [],
};
