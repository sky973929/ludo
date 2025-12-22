const COLORS = [
  { name: 'Red', key: 'red', color: '#e74c3c', startIndex: 0, home: [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6]] },
  { name: 'Green', key: 'green', color: '#2ecc71', startIndex: 13, home: [[6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [6, 8]] },
  { name: 'Yellow', key: 'yellow', color: '#f1c40f', startIndex: 26, home: [[13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 8]] },
  { name: 'Blue', key: 'blue', color: '#3498db', startIndex: 39, home: [[8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6]] }
];

const PATH = [
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [5, 4], [4, 4], [4, 5], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [4, 9], [4, 10], [5, 10], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [9, 10], [10, 10], [10, 9], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [10, 5], [10, 4], [9, 4], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0]
];

const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];
const TOKEN_COUNT = 4;
const HOME_STEPS = 6;
const END_STEP = PATH.length + HOME_STEPS; // final move lands in center

class Sound {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  toggle(state) {
    this.enabled = state;
  }

  play(frequency = 600, duration = 0.12) {
    if (!this.enabled) return;
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = frequency;
    osc.type = 'triangle';
    gain.gain.value = 0.08;
    osc.connect(gain).connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

class LudoGame {
  constructor() {
    this.players = [];
    this.turn = 0;
    this.dice = null;
    this.gameOver = false;
    this.sound = new Sound();
    this.waitingMove = false;
    this.canvas = document.getElementById('board');
    this.ctx = this.canvas.getContext('2d');
    this.cellSize = this.canvas.width / 15;
    this.playerListEl = document.getElementById('player-list');
    this.turnIndicator = document.getElementById('turn-indicator');
    this.diceValueEl = document.getElementById('dice-value');
    this.rollBtn = document.getElementById('roll');
    this.botSelect = document.getElementById('bot-count');
    this.humanSelect = document.getElementById('human-count');
    this.soundToggle = document.getElementById('sound-toggle');
    this.newGameBtn = document.getElementById('new-game');
    this.boardBg = '#ecf0f1';

    this.bindUI();
    this.reset();
  }

  bindUI() {
    this.rollBtn.addEventListener('click', () => this.roll());
    this.newGameBtn.addEventListener('click', () => this.reset());
    this.botSelect.addEventListener('change', () => this.reset());
    this.humanSelect.addEventListener('change', () => this.reset());
    this.soundToggle.addEventListener('change', (e) => this.sound.toggle(e.target.checked));

    this.canvas.addEventListener('click', (e) => {
      const { offsetX, offsetY } = e;
      const clicked = this.pickToken(offsetX, offsetY);
      if (clicked !== null) {
        this.moveToken(clicked.playerIndex, clicked.tokenIndex);
      }
    });
  }

  reset() {
    const humans = Math.min(4, parseInt(this.humanSelect.value, 10));
    const bots = Math.min(4, parseInt(this.botSelect.value, 10));
    const slots = Math.min(4, Math.max(2, humans + bots));
    const humanCount = Math.min(humans, slots);
    this.players = [];
    for (let i = 0; i < slots; i++) {
      const isBot = i >= humanCount;
      const color = COLORS[i];
      this.players.push({
        ...color,
        isBot,
        tokens: Array.from({ length: TOKEN_COUNT }, () => ({ progress: -1 }))
      });
    }
    this.turn = 0;
    this.dice = null;
    this.gameOver = false;
    this.waitingMove = false;
    this.updatePlayerList();
    this.updateTurnText();
    this.diceValueEl.textContent = '-';
    this.rollBtn.disabled = false;
    this.render();
    this.maybeBotTurn();
  }

  roll() {
    if (this.gameOver) return;
    if (this.waitingMove) return;
    const player = this.players[this.turn];
    if (!player) return;
    this.dice = 1 + Math.floor(Math.random() * 6);
    this.diceValueEl.textContent = this.dice;
    this.sound.play(500 + this.dice * 40, 0.14);

    const moves = this.legalMoves(player, this.dice);
    if (moves.length === 0) {
      this.advanceTurn();
      return;
    }

    this.waitingMove = true;
    this.rollBtn.disabled = true;
    this.updateTurnText();

    if (player.isBot) {
      setTimeout(() => this.performBotMove(moves), 320);
    }
  }

  legalMoves(player, roll) {
    const moves = [];
    player.tokens.forEach((t, idx) => {
      if (t.progress === -1 && roll === 6) {
        moves.push({ token: idx, next: 0 });
      } else if (t.progress >= 0) {
        const target = t.progress + roll;
        if (target <= END_STEP) {
          moves.push({ token: idx, next: target });
        }
      }
    });
    return moves;
  }

  moveToken(playerIndex, tokenIndex) {
    if (this.gameOver) return;
    if (playerIndex !== this.turn) return;
    const player = this.players[playerIndex];
    if (player.isBot && playerIndex !== this.turn) return;
    if (this.dice === null) return;

    const token = player.tokens[tokenIndex];
    const move = this.legalMoves(player, this.dice).find((m) => m.token === tokenIndex);
    if (!move) return;

    token.progress = move.next;
    this.waitingMove = false;
    this.rollBtn.disabled = false;
    this.handleCapture(playerIndex, tokenIndex);
    this.render();

    if (this.hasWon(player)) {
      this.turnIndicator.textContent = `${player.name} wins!`;
      this.turnIndicator.style.background = player.color;
      this.turnIndicator.style.color = '#fff';
      this.rollBtn.disabled = true;
      this.gameOver = true;
      this.sound.play(800, 0.3);
      return;
    }

    if (this.dice === 6) {
      this.dice = null;
      this.diceValueEl.textContent = '-';
      this.updateTurnText();
      this.maybeBotTurn();
      return;
    }

    this.advanceTurn();
  }

  performBotMove(moves) {
    const player = this.players[this.turn];
    const captureMove = moves.find((m) => this.wouldCapture(player, m.next));
    const move = captureMove || moves[0];
    this.moveToken(this.turn, move.token);
  }

  wouldCapture(player, nextProgress) {
    if (nextProgress < 0 || nextProgress >= END_STEP) return false;
    const tile = this.positionFor(player, nextProgress);
    if (tile.type !== 'path') return false;
    if (SAFE_INDICES.includes(tile.index)) return false;
    return this.players.some((p, pi) => pi !== this.turn && p.tokens.some((t) => {
      if (t.progress < 0 || t.progress > END_STEP) return false;
      const pos = this.positionFor(p, t.progress);
      return pos.type === 'path' && pos.index === tile.index;
    }));
  }

  handleCapture(playerIndex, tokenIndex) {
    const player = this.players[playerIndex];
    const token = player.tokens[tokenIndex];
    const pos = this.positionFor(player, token.progress);
    if (pos.type !== 'path') return;
    if (SAFE_INDICES.includes(pos.index)) return;

    this.players.forEach((p, idx) => {
      if (idx === playerIndex) return;
      p.tokens.forEach((t) => {
        if (t.progress < 0 || t.progress > END_STEP) return;
        const otherPos = this.positionFor(p, t.progress);
        if (otherPos.type === 'path' && otherPos.index === pos.index) {
          t.progress = -1;
          this.sound.play(350, 0.2);
        }
      });
    });
  }

  advanceTurn() {
    this.dice = null;
    this.diceValueEl.textContent = '-';
    this.turn = (this.turn + 1) % this.players.length;
    this.waitingMove = false;
    this.rollBtn.disabled = false;
    this.updateTurnText();
    this.render();
    this.maybeBotTurn();
  }

  maybeBotTurn() {
    const player = this.players[this.turn];
    if (player && player.isBot && !this.gameOver) {
      setTimeout(() => this.roll(), 400);
    }
  }

  hasWon(player) {
    return player.tokens.every((t) => t.progress === END_STEP);
  }

  updatePlayerList() {
    this.playerListEl.innerHTML = '';
    this.players.forEach((p) => {
      const chip = document.createElement('div');
      chip.className = `chip ${p.key}`;
      chip.textContent = `${p.name} ${p.isBot ? '🤖' : '🙂'}`;
      this.playerListEl.appendChild(chip);
    });
  }

  updateTurnText() {
    const player = this.players[this.turn];
    if (!player) {
      this.turnIndicator.textContent = 'Add players';
      return;
    }
    const label = `${player.name} ${player.isBot ? '(Bot)' : ''}`.trim();
    if (this.waitingMove && this.dice !== null) {
      const suffix = player.isBot ? 'is moving…' : 'pick a token';
      this.turnIndicator.textContent = `${label} — ${suffix}`;
    } else {
      this.turnIndicator.textContent = label;
    }
    this.turnIndicator.style.background = '#fff';
    this.turnIndicator.style.color = '#2d3436';
  }

  pickToken(x, y) {
    const player = this.players[this.turn];
    if (!player || player.isBot) return null;
    if (!this.waitingMove) return null;
    const tokenRadius = this.cellSize * 0.35;
    for (let ti = 0; ti < player.tokens.length; ti++) {
      const t = player.tokens[ti];
      const pos = this.pixelForToken(player, t, ti);
      const dx = x - pos.x;
      const dy = y - pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < tokenRadius) {
        return { playerIndex: this.turn, tokenIndex: ti };
      }
    }
    return null;
  }

  positionFor(player, progress) {
    if (progress < 0) return { type: 'yard' };
    if (progress <= PATH.length - 1) {
      const index = (player.startIndex + progress) % PATH.length;
      return { type: 'path', coords: PATH[index], index };
    }
    const homeIndex = progress - PATH.length;
    if (homeIndex < HOME_STEPS) {
      return { type: 'home', coords: player.home[homeIndex], index: homeIndex };
    }
    return { type: 'center' };
  }

  pixelForToken(player, token, tokenIndex = 0) {
    const pos = this.positionFor(player, token.progress);
    const { x, y } = this.coordsToPixel({ ...pos, key: player.key }, tokenIndex);
    return { x, y };
  }

  coordsToPixel(pos, tokenIndex = 0) {
    if (pos.type === 'yard') {
      const baseMap = {
        red: [1.5, 1.5],
        green: [1.5, 13.5],
        yellow: [13.5, 13.5],
        blue: [13.5, 1.5]
      };
      const offsets = [
        [-0.8, -0.8],
        [0.8, -0.8],
        [-0.8, 0.8],
        [0.8, 0.8]
      ];
      const offset = offsets[tokenIndex % offsets.length];
      const [r, c] = baseMap[pos.key] || [1.5, 1.5];
      return {
        x: (c + offset[1]) * this.cellSize,
        y: (r + offset[0]) * this.cellSize
      };
    }
    if (pos.type === 'center') {
      const mid = this.cellSize * 7.5;
      return { x: mid, y: mid };
    }
    const [row, col] = pos.coords;
    return {
      x: (col + 0.5) * this.cellSize,
      y: (row + 0.5) * this.cellSize
    };
  }

  drawBoard() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = this.boardBg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = '#c8d6e5';
    for (let i = 0; i <= 15; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.cellSize, 0);
      ctx.lineTo(i * this.cellSize, this.canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * this.cellSize);
      ctx.lineTo(this.canvas.width, i * this.cellSize);
      ctx.stroke();
    }

    COLORS.forEach((c) => this.paintHome(c));
    PATH.forEach(([r, c], idx) => this.paintCell(r, c, idx));
    this.drawCenterStar();
  }

  paintHome(color) {
    const ctx = this.ctx;
    const size = this.cellSize * 6;
    const origins = {
      red: [0, 0],
      green: [0, 9],
      yellow: [9, 9],
      blue: [9, 0]
    };
    const [r, c] = origins[color.key];
    ctx.fillStyle = `${color.color}22`;
    ctx.fillRect(c * this.cellSize, r * this.cellSize, size, size);
    ctx.fillStyle = color.color;
    ctx.font = `${this.cellSize * 0.8}px sans-serif`;
    ctx.fillText('★', (c + 2.6) * this.cellSize, (r + 3.5) * this.cellSize);

    color.home.forEach(([hr, hc], i) => {
      ctx.fillStyle = `${color.color}${i % 2 === 0 ? '55' : '33'}`;
      ctx.fillRect(hc * this.cellSize, hr * this.cellSize, this.cellSize, this.cellSize);
    });
  }

  paintCell(r, c, idx) {
    const ctx = this.ctx;
    const x = c * this.cellSize;
    const y = r * this.cellSize;
    const safe = SAFE_INDICES.includes(idx);
    ctx.fillStyle = safe ? '#ffeaa7' : '#ffffff';
    ctx.strokeStyle = '#b2bec3';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, this.cellSize, this.cellSize);
    ctx.strokeRect(x, y, this.cellSize, this.cellSize);
  }

  drawCenterStar() {
    const ctx = this.ctx;
    const c = this.cellSize * 7.5;
    const r = this.cellSize * 7.5;
    ctx.fillStyle = '#dfe6e9';
    ctx.beginPath();
    ctx.arc(c, r, this.cellSize * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTokens() {
    this.players.forEach((player) => {
      player.tokens.forEach((t, idx) => this.drawToken(player, t, idx));
    });
  }

  drawToken(player, token, tokenIndex = 0) {
    const posInfo = this.positionFor(player, token.progress);
    const { x, y } = this.coordsToPixel({ ...posInfo, key: player.key }, tokenIndex);
    const ctx = this.ctx;
    const radius = this.cellSize * 0.35;

    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, radius + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = `${this.cellSize * 0.35}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('●', x, y + 2);
  }

  render() {
    this.drawBoard();
    this.drawTokens();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new LudoGame();
  window.ludoGame = game;
});
