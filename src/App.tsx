import { useCallback, useEffect, useMemo, useState } from 'react';
import GamePage from './pages/Game';
import HomePage, { PlayerConfig } from './pages/Home';
import BoardEditorPage from './pages/BoardEditor';
import './App.css';

type Page = 'home' | 'game' | 'editor';

function pathForPage(page: Page): string {
  if (page === 'game') return '/game';
  if (page === 'editor') return '/board-editor';
  return '/';
}

function pageFromPath(pathname: string): Page {
  if (pathname.includes('game')) return 'game';
  if (pathname.includes('board-editor')) return 'editor';
  return 'home';
}

function App() {
  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const [players, setPlayers] = useState<PlayerConfig[]>([
    { name: 'Player 1', type: 'human', color: 'red' },
    { name: 'Player 2', type: 'ai', color: 'green' },
  ]);

  useEffect(() => {
    const handlePop = () => setPage(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = useCallback((next: Page) => {
    setPage(next);
    window.history.pushState(null, '', pathForPage(next));
  }, []);

  const activeContent = useMemo(() => {
    if (page === 'home') {
      return (
        <HomePage
          players={players}
          onPlayersChange={setPlayers}
          onStart={() => navigate('game')}
        />
      );
    }

    if (page === 'game') {
      return (
        <GamePage
          players={players}
          onReset={() => navigate('home')}
        />
      );
    }

    return <BoardEditorPage />;
  }, [navigate, page, players]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Ludo</h1>
        <nav>
          <button
            type="button"
            className={page === 'home' ? 'active' : ''}
            onClick={() => navigate('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={page === 'game' ? 'active' : ''}
            onClick={() => navigate('game')}
          >
            Game
          </button>
          <button
            type="button"
            className={page === 'editor' ? 'active' : ''}
            onClick={() => navigate('editor')}
          >
            Board Editor
          </button>
        </nav>
      </header>
      <main>{activeContent}</main>
    </div>
  );
}

export default App;
