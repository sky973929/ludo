# Ludo (React + TypeScript + Vite)

A minimal single-player Ludo web scaffold built with React, TypeScript, and Vite. It now includes a basic, locally run rules engine (turn order, legal move generation, capturing, and safe tiles) plus a Home page for configuring human/AI players, a Game page with a canvas-rendered circular board you can click to move highlighted pieces, and a board editor for capturing 15x15 grid coordinates.

## Prerequisites
- Node.js 18+
- npm 9+ (comes with Node.js)

## Getting started
```bash
npm install
npm run dev
```

Then open the printed local URL (default: http://localhost:5173).

## Available scripts
- `npm run dev` – start the development server
- `npm run build` – build the production bundle
- `npm run preview` – preview the production build locally
- `npm test` – run vitest on the rules engine

## Project structure
- `src/App.tsx` – top-level layout and navigation between Home, Game, and Board Editor pages
- `src/pages/Home.tsx` – configure players (human or AI) and colors before starting
- `src/pages/Game.tsx` – basic turn loop UI (roll dice, pick a legal move list, apply move) with a clickable canvas board
- `src/pages/BoardEditor.tsx` – 15x15 grid capture tool for track, home, and yard coordinates (exports JSON for future art)
- `src/game/*` – rules engine (board helpers, models, move generation, and state transitions)
- `src/ui/canvas/*` – circular board geometry helpers and rendering logic

## Notes
- The scaffold intentionally avoids large state-management libraries.
- Styling uses simple CSS modules in `src/App.css` and `src/index.css`.
- Implemented rules cover: entering the track on a six, advancing along the track and into home by exact count, safe squares, and capturing a lone opponent on unsafe track tiles. Multi-piece stacking/forts and AI are not implemented yet.
- The Board Editor page (/board-editor tab) shows a 15x15 grid; click to append cells to the selected segment, undo/clear as needed, and copy the JSON output for use in a classic board layout.
- Next steps: refine the canvas visuals (grid-style board art) and add AI move selection.
