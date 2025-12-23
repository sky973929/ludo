import { ChangeEvent } from 'react';

export type PlayerType = 'human' | 'ai';

export interface PlayerConfig {
  name: string;
  type: PlayerType;
  color: string;
}

interface HomePageProps {
  players: PlayerConfig[];
  onPlayersChange: (players: PlayerConfig[]) => void;
  onStart: () => void;
}

function HomePage({ players, onPlayersChange, onStart }: HomePageProps) {
  const handleFieldChange = (
    index: number,
    field: keyof PlayerConfig,
    value: string,
  ) => {
    const updated = players.map((player, i) =>
      i === index ? { ...player, [field]: value } : player,
    );
    onPlayersChange(updated);
  };

  const addPlayer = () => {
    onPlayersChange([
      ...players,
      {
        name: `Player ${players.length + 1}`,
        type: 'human',
        color: '#2a9d8f',
      },
    ]);
  };

  const removePlayer = (index: number) => {
    const updated = players.filter((_, i) => i !== index);
    onPlayersChange(updated);
  };

  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>, index: number) => {
    handleFieldChange(index, 'type', event.target.value);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Home</h2>
          <p>Configure human or AI players before starting a match.</p>
        </div>
        <button type="button" onClick={addPlayer} className="secondary">
          + Add player
        </button>
      </div>
      <div className="player-grid">
        {players.map((player, index) => (
          <div key={player.name + index} className="player-card">
            <div className="field">
              <label htmlFor={`name-${index}`}>Name</label>
              <input
                id={`name-${index}`}
                value={player.name}
                onChange={(event) => handleFieldChange(index, 'name', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={`type-${index}`}>Type</label>
              <select
                id={`type-${index}`}
                value={player.type}
                onChange={(event) => handleTypeChange(event, index)}
              >
                <option value="human">Human</option>
                <option value="ai">AI</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor={`color-${index}`}>Color</label>
              <input
                id={`color-${index}`}
                type="color"
                value={player.color}
                onChange={(event) => handleFieldChange(index, 'color', event.target.value)}
              />
            </div>
            {players.length > 1 && (
              <button type="button" className="link" onClick={() => removePlayer(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="actions">
        <button type="button" className="primary" onClick={onStart}>
          Start Game
        </button>
      </div>
    </section>
  );
}

export default HomePage;
