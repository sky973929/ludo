# Ludo (React + TypeScript + Vite)

A minimal single-player Ludo web scaffold built with React, TypeScript, and Vite. It includes a Home page for configuring human/AI players and a Game page with a canvas-based "Board Placeholder" ready for future board rendering.

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

## Project structure
- `src/App.tsx` – top-level layout and navigation between Home and Game pages
- `src/pages/Home.tsx` – configure players (human or AI) and colors before starting
- `src/pages/Game.tsx` – canvas placeholder that currently renders "Board Placeholder"

## Notes
- The scaffold intentionally avoids large state-management libraries.
- Styling uses simple CSS modules in `src/App.css` and `src/index.css`.
