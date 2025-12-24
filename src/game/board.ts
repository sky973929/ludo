import { Color, HomePos, Pos, TrackPos, YardPos } from './model';

export const TRACK_LEN = 52;
export const HOME_LEN = 6;

export const START_INDEX: Record<Color, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_TRACK_INDEXES: number[] = [0, 8, 13, 21, 26, 34, 39, 47];

export function normalizeTrack(index: number): number {
  const mod = index % TRACK_LEN;
  return mod < 0 ? mod + TRACK_LEN : mod;
}

export function isSafeTrack(index: number): boolean {
  return SAFE_TRACK_INDEXES.includes(normalizeTrack(index));
}

export function stepsToHomeEntry(color: Color, trackIndex: number): number {
  const diff = (START_INDEX[color] - normalizeTrack(trackIndex) + TRACK_LEN) % TRACK_LEN;
  return diff === 0 ? TRACK_LEN : diff;
}

export function advance(color: Color, pos: Pos, steps: number): Pos | null {
  if (steps <= 0) return pos;

  if (pos.kind === 'yard') {
    if (steps !== 6) return null;
    return { kind: 'track', index: START_INDEX[color] } satisfies TrackPos;
  }

  if (pos.kind === 'home') {
    const nextIndex = pos.index + steps;
    if (nextIndex >= HOME_LEN) return null;
    return { kind: 'home', index: nextIndex } satisfies HomePos;
  }

  const untilHome = stepsToHomeEntry(color, pos.index);
  if (steps <= untilHome) {
    const target = normalizeTrack(pos.index + steps);
    return { kind: 'track', index: target } satisfies TrackPos;
  }

  const remaining = steps - untilHome;
  const homeIndex = remaining - 1;
  if (homeIndex >= HOME_LEN) return null;
  return { kind: 'home', index: homeIndex } satisfies HomePos;
}

export function isYard(pos: Pos): pos is YardPos {
  return pos.kind === 'yard';
}

export function isTrack(pos: Pos): pos is TrackPos {
  return pos.kind === 'track';
}

export function isHome(pos: Pos): pos is HomePos {
  return pos.kind === 'home';
}
