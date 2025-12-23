import { useEffect, useMemo, useRef, useState } from 'react';
import type { Color } from '../game/model';
import type { Cell } from '../ui/canvas/gridGeometry';

const GRID_SIZE = 15;
const CANVAS_SIZE = 640;

type SelectionKey = 'track' | `home-${Color}` | `yard-${Color}`;

type BoardData = {
  track: Cell[];
  home: Record<Color, Cell[]>;
  yard: Record<Color, Cell[]>;
};

const COLORS: Color[] = ['red', 'green', 'yellow', 'blue'];

const COLOR_SWATCH: Record<Color, string> = {
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#eab308',
  blue: '#3b82f6',
};

function createInitialData(): BoardData {
  return {
    track: [],
    home: {
      red: [],
      green: [],
      yellow: [],
      blue: [],
    },
    yard: {
      red: [],
      green: [],
      yellow: [],
      blue: [],
    },
  };
}

function getList(data: BoardData, key: SelectionKey): Cell[] {
  if (key === 'track') return data.track;
  const [section, color] = key.split('-') as ['home' | 'yard', Color];
  return data[section][color];
}

function updateList(
  data: BoardData,
  key: SelectionKey,
  update: (prev: Cell[]) => Cell[],
): BoardData {
  if (key === 'track') {
    return { ...data, track: update(data.track) };
  }
  const [section, color] = key.split('-') as ['home' | 'yard', Color];
  return {
    ...data,
    [section]: {
      ...data[section],
      [color]: update(data[section][color]),
    },
  } as BoardData;
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number,
) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#e2e8f0';
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const pos = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(width, pos);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, height);
    ctx.stroke();
  }
}

function drawCells(
  ctx: CanvasRenderingContext2D,
  cells: Cell[],
  fill: string,
  textColor: string,
  cellSize: number,
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(10, cellSize * 0.35)}px sans-serif`;
  cells.forEach((cell, index) => {
    const x = cell.c * cellSize;
    const y = cell.r * cellSize;
    ctx.fillStyle = fill;
    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
    ctx.fillStyle = textColor;
    ctx.fillText(String(index + 1), x + cellSize / 2, y + cellSize / 2);
  });
}

function drawHover(
  ctx: CanvasRenderingContext2D,
  cell: Cell,
  cellSize: number,
  color: string,
) {
  const x = cell.c * cellSize;
  const y = cell.r * cellSize;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
}

const SECTION_LABELS: Record<SelectionKey, string> = {
  track: 'Track (52 cells)',
  'home-red': 'Home Red (6 cells)',
  'home-green': 'Home Green (6 cells)',
  'home-yellow': 'Home Yellow (6 cells)',
  'home-blue': 'Home Blue (6 cells)',
  'yard-red': 'Yard Red (4 cells)',
  'yard-green': 'Yard Green (4 cells)',
  'yard-yellow': 'Yard Yellow (4 cells)',
  'yard-blue': 'Yard Blue (4 cells)',
};

function BoardEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<BoardData>(() => createInitialData());
  const [selection, setSelection] = useState<SelectionKey>('track');
  const [hover, setHover] = useState<Cell | null>(null);

  const jsonOutput = useMemo(
    () =>
      JSON.stringify(
        {
          TRACK_CELLS: data.track.map(({ r, c }) => ({ r, c })),
          HOME_CELLS: data.home,
          YARD_CELLS: data.yard,
        },
        null,
        2,
      ),
    [data],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;
    drawGrid(ctx, canvas.width, canvas.height, cellSize);

    drawCells(ctx, data.track, '#bfdbfe', '#0f172a', cellSize);

    for (const color of COLORS) {
      drawCells(ctx, data.home[color], `${COLOR_SWATCH[color]}33`, '#0f172a', cellSize);
      drawCells(ctx, data.yard[color], `${COLOR_SWATCH[color]}22`, '#0f172a', cellSize);
    }

    if (hover) {
      drawHover(ctx, hover, cellSize, '#0ea5e9');
    }
  }, [data, hover]);

  const toCell = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>): Cell | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cellSize = canvas.width / GRID_SIZE;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const c = Math.floor((x / rect.width) * GRID_SIZE);
    const r = Math.floor((y / rect.height) * GRID_SIZE);
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return null;
    return { r, c };
  };

  const handleClick: React.MouseEventHandler<HTMLCanvasElement> = (event) => {
    const cell = toCell(event);
    if (!cell) return;
    setData((prev) =>
      updateList(prev, selection, (list) => {
        const exists = list.some((c) => c.r === cell.r && c.c === cell.c);
        if (exists) return list;
        return [...list, cell];
      }),
    );
  };

  const handleUndo = () => {
    setData((prev) => updateList(prev, selection, (list) => list.slice(0, -1)));
  };

  const handleClearSelection = () => {
    setData((prev) => updateList(prev, selection, () => []));
  };

  const handleClearAll = () => setData(createInitialData());

  const trackCount = data.track.length;
  const homeCount = COLORS.reduce<Record<Color, number>>((acc, color) => {
    acc[color] = data.home[color].length;
    return acc;
  }, { red: 0, green: 0, yellow: 0, blue: 0 });
  const yardCount = COLORS.reduce<Record<Color, number>>((acc, color) => {
    acc[color] = data.yard[color].length;
    return acc;
  }, { red: 0, green: 0, yellow: 0, blue: 0 });

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Board Editor</h2>
          <p>Click cells to build a 15x15 coordinate map for the classic board.</p>
        </div>
      </div>

      <div className="editor-layout">
        <div className="board-wrapper">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onClick={handleClick}
            onMouseMove={(e) => setHover(toCell(e))}
            onMouseLeave={() => setHover(null)}
          />
          <div className="hover-readout">
            Hover: {hover ? `r${hover.r}, c${hover.c}` : '—'}
          </div>
        </div>

        <div className="editor-sidebar">
          <div className="field">
            <label htmlFor="section">Section</label>
            <div className="section-grid">
              {(Object.keys(SECTION_LABELS) as SelectionKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={selection === key ? 'active' : ''}
                  onClick={() => setSelection(key)}
                >
                  {SECTION_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="field action-row">
            <button type="button" onClick={handleUndo}>
              Undo Last
            </button>
            <button type="button" onClick={handleClearSelection}>
              Clear Selection
            </button>
            <button type="button" className="secondary" onClick={handleClearAll}>
              Clear All
            </button>
          </div>

          <div className="counts">
            <div>
              <strong>Track:</strong> {trackCount} / 52 {trackCount === 52 ? '✅' : ''}
            </div>
            <div className="count-grid">
              {COLORS.map((color) => (
                <div key={`home-${color}`} className="count-pill">
                  <span className="dot" style={{ background: COLOR_SWATCH[color] }} />
                  Home {color}: {homeCount[color]} / 6 {homeCount[color] === 6 ? '✅' : ''}
                </div>
              ))}
            </div>
            <div className="count-grid">
              {COLORS.map((color) => (
                <div key={`yard-${color}`} className="count-pill">
                  <span className="dot" style={{ background: COLOR_SWATCH[color] }} />
                  Yard {color}: {yardCount[color]} / 4 {yardCount[color] === 4 ? '✅' : ''}
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>JSON Output</label>
            <textarea value={jsonOutput} readOnly rows={16} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default BoardEditorPage;
