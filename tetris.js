// ===== Mini Tetris (para subir el ánimo) =====

const Tetris = (() => {
  const COLS = 10, ROWS = 20, C = 6;
  const COLORS = { I: '#6fd3f0', O: '#f4e04d', T: '#b27be8', S: '#8fd16a', Z: '#e85a6b', J: '#5a7be8', L: '#f39a3c' };
  const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  };

  const dlg = document.getElementById('tetris-dlg');
  const cv = document.getElementById('tetris');
  const ctx = cv.getContext('2d');
  const nextCv = document.getElementById('tetris-next');
  const nctx = nextCv.getContext('2d');
  const $score = document.getElementById('t-score');
  const $lines = document.getElementById('t-lines');
  const $level = document.getElementById('t-level');
  const $over = document.getElementById('tetris-over');

  let board, cur, next, bag = [], score, lines, level, over, paused, acc, lastT, raf;
  let total = { lines: 0, score: 0 }, onDone = null, flash = 0;

  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, v + amt));
    return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`;
  };

  function take() {
    if (!bag.length) {
      bag = Object.keys(SHAPES);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    const t = bag.pop();
    return { t, m: SHAPES[t].map(r => [...r]), x: 0, y: 0 };
  }

  function collide(m, x, y) {
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const nx = x + c, ny = y + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
    return false;
  }

  function spawn() {
    cur = next || take();
    next = take();
    cur.x = Math.floor((COLS - cur.m[0].length) / 2);
    cur.y = cur.t === 'I' ? -1 : 0;
    if (collide(cur.m, cur.x, cur.y)) gameOver();
    drawNext();
  }

  const rotate = m => m[0].map((_, i) => m.map(r => r[i]).reverse());

  function tryRotate() {
    const m = rotate(cur.m);
    for (const k of [0, -1, 1, -2, 2]) {
      if (!collide(m, cur.x + k, cur.y)) { cur.m = m; cur.x += k; return; }
    }
  }

  function move(dx) { if (!collide(cur.m, cur.x + dx, cur.y)) cur.x += dx; }

  function step() {
    if (!collide(cur.m, cur.x, cur.y + 1)) { cur.y++; return true; }
    lock();
    return false;
  }

  function softDrop() { if (step()) score += 1; acc = 0; hud(); }

  function hardDrop() {
    let n = 0;
    while (!collide(cur.m, cur.x, cur.y + 1)) { cur.y++; n++; }
    score += n * 2;
    lock();
  }

  function lock() {
    let top = false;
    cur.m.forEach((row, r) => row.forEach((v, c) => {
      if (!v) return;
      const y = cur.y + r;
      if (y < 0) top = true; else board[y][cur.x + c] = cur.t;
    }));
    if (top) return gameOver();
    clearLines();
    spawn();
    acc = 0;
  }

  function clearLines() {
    let n = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(Boolean)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        n++; y++;
      }
    }
    if (n) {
      lines += n;
      score += [0, 100, 300, 500, 800][n] * level;
      level = Math.floor(lines / 5) + 1;
      flash = 4;
    }
    hud();
  }

  function gameOver() {
    over = true;
    $over.hidden = false;
  }

  function hud() {
    $score.textContent = score;
    $lines.textContent = lines;
    $level.textContent = level;
  }

  function cell(c2, x, y, color, s = C) {
    c2.fillStyle = color;
    c2.fillRect(x, y, s, s);
    c2.fillStyle = shade(color, 60);
    c2.fillRect(x, y, s, 1); c2.fillRect(x, y, 1, s);
    c2.fillStyle = shade(color, -70);
    c2.fillRect(x, y + s - 1, s, 1); c2.fillRect(x + s - 1, y, 1, s);
  }

  function draw() {
    ctx.fillStyle = flash > 0 ? '#3a3468' : '#1b1b2a';
    ctx.fillRect(0, 0, cv.width, cv.height);
    if (flash > 0) flash--;
    ctx.fillStyle = '#2c2a46';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) ctx.fillRect(x * C + 2, y * C + 2, 2, 2);

    board.forEach((row, y) => row.forEach((t, x) => { if (t) cell(ctx, x * C, y * C, COLORS[t]); }));

    if (!over && cur) {
      // Sombra de dónde caerá
      let gy = cur.y;
      while (!collide(cur.m, cur.x, gy + 1)) gy++;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      cur.m.forEach((row, r) => row.forEach((v, c) => {
        if (v && gy + r >= 0) ctx.fillRect((cur.x + c) * C, (gy + r) * C, C, C);
      }));
      cur.m.forEach((row, r) => row.forEach((v, c) => {
        if (v && cur.y + r >= 0) cell(ctx, (cur.x + c) * C, (cur.y + r) * C, COLORS[cur.t]);
      }));
    }

    if (paused && !over) {
      ctx.fillStyle = 'rgba(27,27,42,0.7)';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#fff';
      [[1, 0], [3, 0], [1, 1], [3, 1], [1, 2], [3, 2]].forEach(([x, y]) => ctx.fillRect(22 + x * 3, 52 + y * 4, 3, 4));
    }
  }

  function drawNext() {
    nctx.fillStyle = '#1b1b2a';
    nctx.fillRect(0, 0, nextCv.width, nextCv.height);
    const m = next.m, s = 6;
    const w = m[0].length * s, h = m.length * s;
    const ox = Math.floor((nextCv.width - w) / 2), oy = Math.floor((nextCv.height - h) / 2);
    m.forEach((row, r) => row.forEach((v, c) => { if (v) cell(nctx, ox + c * s, oy + r * s, COLORS[next.t], s); }));
  }

  function loop(t) {
    if (!dlg.open) return;
    const dt = t - lastT; lastT = t;
    if (!over && !paused) {
      acc += dt;
      const speed = Math.max(90, 650 - (level - 1) * 60);
      if (acc >= speed) { acc = 0; step(); }
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function reset() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    total.lines += lines || 0;
    total.score += score || 0;
    score = 0; lines = 0; level = 1; over = false; paused = false; acc = 0; next = null; bag = [];
    $over.hidden = true;
    spawn();
    hud();
  }

  function open(cb) {
    onDone = cb;
    total = { lines: 0, score: 0 };
    score = 0; lines = 0;
    reset();
    dlg.showModal();
    lastT = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function close() {
    if (dlg.open) dlg.close();
    cancelAnimationFrame(raf);
    stopRepeat();
    const res = { lines: total.lines + lines, score: total.score + score };
    const cb = onDone; onDone = null;
    if (cb) cb(res);
  }
  // Esc: cerramos nosotros para entregar el resultado
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });

  // ---------- Controles ----------
  const act = {
    left: () => move(-1),
    right: () => move(1),
    rot: tryRotate,
    down: softDrop,
    drop: hardDrop,
  };
  function doAct(name) {
    if (over || paused || !cur) return;
    act[name]();
  }

  document.addEventListener('keydown', e => {
    if (!dlg.open) return;
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'rot', x: 'rot', ArrowDown: 'down', ' ': 'drop' };
    if (e.key === 'p' || e.key === 'P') { paused = !paused; return; }
    if (map[e.key]) { e.preventDefault(); doAct(map[e.key]); }
  });

  let repeatT, repeatI;
  function stopRepeat() { clearTimeout(repeatT); clearInterval(repeatI); }
  document.querySelectorAll('[data-t]').forEach(b => {
    const name = b.dataset.t;
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      doAct(name);
      if (['left', 'right', 'down'].includes(name)) {
        stopRepeat();
        repeatT = setTimeout(() => { repeatI = setInterval(() => doAct(name), 60); }, 180);
      }
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stopRepeat));
  });

  document.getElementById('t-again').addEventListener('click', reset);
  document.getElementById('t-pause').addEventListener('click', () => { if (!over) paused = !paused; });
  document.querySelectorAll('.t-exit').forEach(b => b.addEventListener('click', close));

  return { open };
})();
