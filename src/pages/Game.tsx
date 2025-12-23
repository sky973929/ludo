import { useEffect, useRef } from 'react';
import type { PlayerConfig } from './Home';

interface GamePageProps {
  players: PlayerConfig[];
  onReset: () => void;
}

function GamePage({ players, onReset }: GamePageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f1f3f5';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#2b2d42';
    context.font = 'bold 24px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Board Placeholder', canvas.width / 2, canvas.height / 2);
  }, [players]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Game</h2>
          <p>Board Placeholder</p>
        </div>
        <button type="button" className="secondary" onClick={onReset}>
          Back to Home
        </button>
      </div>
      <div className="board-wrapper">
        <canvas ref={canvasRef} width={640} height={640} />
      </div>
      <div className="player-summary">
        {players.map((player) => (
          <div key={player.name} className="player-pill" style={{ '--pill-color': player.color } as React.CSSProperties}>
            <span className="color" aria-hidden />
            <span>{player.name}</span>
            <small>{player.type === 'human' ? 'Human' : 'AI'}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export default GamePage;
