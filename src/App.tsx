import { useMemo, useState } from 'react';
import GamePage from './pages/Game';
import HomePage, { PlayerConfig } from './pages/Home';
import './App.css';

type Page = 'home' | 'game';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [players, setPlayers] = useState<PlayerConfig[]>([
    { name: 'Player 1', type: 'human', color: '#e63946' },
    { name: 'Player 2', type: 'ai', color: '#457b9d' },
  ]);

  const activeContent = useMemo(() => {
    if (page === 'home') {
      return (
        <HomePage
          players={players}
          onPlayersChange={setPlayers}
          onStart={() => setPage('game')}
        />
      );
    }

    return (
      <GamePage
        players={players}
        onReset={() => setPage('home')}
      />
    );
  }, [page, players]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Ludo</h1>
        <nav>
          <button
            type="button"
            className={page === 'home' ? 'active' : ''}
            onClick={() => setPage('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={page === 'game' ? 'active' : ''}
            onClick={() => setPage('game')}
          >
            Game
          </button>
        </nav>
      </header>
      <main>{activeContent}</main>
    </div>
  );
}

export default App;
