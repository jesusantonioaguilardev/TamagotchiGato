// ===== Tamagotchi Gato — pixel art =====

import { newPet, catchUp, applyAction, addLog } from './logic.js';

// ---------- Otros sprites ----------
const SPR = {
  fish:   ['..OOOO.O', '.OKOOOOO', 'OOOOOOO.', '.OOOOOOO', '..OOOO.O'],
  poop:   ['...B...', '..BBB..', '.BBBBB.', 'BBBBBBB'],
  heart:  ['.R.R.', 'RRRRR', '.RRR.', '..R..'],
  z:      ['WWWW', '..W.', '.W..', 'WWWW'],
  ball:   ['.RRR.', 'RWRRR', 'RRRRR', 'RRRRR', '.RRR.'],
  bubble: ['.S.', 'SWS', '.S.'],
  skull:  ['.KKK.', 'KWKWK', 'KWWWK', '.KWK.'],
  star:   ['..Y..', '.YYY.', 'YYYYY', '.YYY.', '..Y..'],
  star2:  ['.Y.', 'YYY', '.Y.'],
  halo:   ['.YYYY.', 'Y....Y', '.YYYY.'],
};

// Iconos 8x8 para la interfaz
const ICONS = {
  fish:  ['........', '..OOOO.O', '.OKOOOOO', 'OOOOOOO.', '.OOOOOOO', '..OOOO.O', '........', '........'],
  ball:  ['..RRRR..', '.RWRRRR.', 'RWRRRRRR', 'RRRRRRRR', 'RRRRRRRR', 'RRRRRRRR', '.RRRRRR.', '..RRRR..'],
  moon:  ['..YYYY..', '.YYY....', 'YYY.....', 'YYY.....', 'YYY.....', 'YYY.....', '.YYY....', '..YYYY..'],
  sun:   ['...YY...', '.Y.YY.Y.', '..YYYY..', 'YYYYYYYY', 'YYYYYYYY', '..YYYY..', '.Y.YY.Y.', '...YY...'],
  drops: ['..S.....', '.SWS..S.', '..S..SWS', '......S.', '...S....', '..SWS...', '...S....', '........'],
  cross: ['..KKKK..', '..KRRK..', 'KKKRRKKK', 'KRRRRRRK', 'KRRRRRRK', 'KKKRRKKK', '..KRRK..', '..KKKK..'],
  heart: ['........', '.RR..RR.', 'RRRRRRRR', 'RWRRRRRR', '.RRRRRR.', '..RRRR..', '...RR...', '........'],
  left:  ['...K....', '..KK....', '.KKKKKKK', 'KKKKKKKK', '.KKKKKKK', '..KK....', '...K....', '........'],
  right: ['....K...', '....KK..', 'KKKKKKK.', 'KKKKKKKK', 'KKKKKKK.', '....KK..', '....K...', '........'],
  down:  ['...KK...', '...KK...', '...KK...', '...KK...', 'KKKKKKKK', '.KKKKKK.', '..KKKK..', '...KK...'],
  drop:  ['...KK...', '...KK...', 'KKKKKKKK', '.KKKKKK.', '..KKKK..', '...KK...', '........', 'KKKKKKKK'],
  rot:   ['..KKKK..', '.K....K.', 'K....KKK', 'K.....KK', 'K....KKK', '.K......', '..KKKK..', '........'],
  bolt:  ['....YY..', '...YY...', '..YY....', '.YYYYYY.', '....YY..', '...YY...', '..YY....', '.Y......'],
};

// ---------- Canvas ----------
const W = 80, H = 60, FLOOR = 52;
const cv = document.getElementById('screen');
const ctx = cv.getContext('2d');

function drawGrid(g, x, y, flip = false, pal = PAL, c2 = ctx) {
  const w = g[0].length;
  for (let r = 0; r < g.length; r++) {
    for (let c = 0; c < g[r].length; c++) {
      const col = pal[g[r][c]];
      if (!col) continue;
      c2.fillStyle = col;
      c2.fillRect(Math.round(flip ? x + w - 1 - c : x + c), Math.round(y + r), 1, 1);
    }
  }
}

function paintIcons() {
  document.querySelectorAll('canvas[data-icon]').forEach(c => {
    const g = ICONS[c.dataset.icon];
    c.width = 8; c.height = 8;
    const c2 = c.getContext('2d');
    c2.clearRect(0, 0, 8, 8);
    drawGrid(g, 0, 0, false, PAL, c2);
  });
}

// ---------- Estado ----------
const KEY = 'tamagatchi-gato-v1';
const KEY_PLAYER = 'tamagatchi-jugador';

// Gato compartido: ?gato=abc123 en la URL
const ROOM = (new URLSearchParams(location.search).get('gato') || '').toLowerCase();
const online = /^[a-z0-9]{6}$/.test(ROOM);

let player = { name: '', cid: '' };
try { Object.assign(player, JSON.parse(localStorage.getItem(KEY_PLAYER)) || {}); } catch (e) {}
if (!player.cid) player.cid = Math.random().toString(36).slice(2, 12);
function savePlayer() {
  try { localStorage.setItem(KEY_PLAYER, JSON.stringify(player)); } catch (e) {}
}
savePlayer();
const playerName = () => player.name || 'Alguien';

function loadLocal() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s.born === 'number') return s;
  } catch (e) {}
  return newPet();
}
function save() {
  if (online) return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

// Ajustes de estilo: la carcasa es de cada persona; la skin es del gato
const KEY_STYLE = 'tamagatchi-gato-style';
let style = { skin: 'marciano', shell: 'uva' };
try { Object.assign(style, JSON.parse(localStorage.getItem(KEY_STYLE)) || {}); } catch (e) {}
let shell = getShell(style.shell);
applyShell(shell);
function saveStyle() {
  try { localStorage.setItem(KEY_STYLE, JSON.stringify(style)); } catch (e) {}
}

let state = online ? newPet() : loadLocal();
if (!state.skin) state.skin = style.skin;
if (!state.log) state.log = [];
let skin = getSkin(state.skin);
let loading = online;
if (!online) { catchUp(state); save(); }

// ---------- Animación y efectos ----------
let frame = 0;
let anim = null;               // { type, t, dur }
let catX = 24, targetX = 24, facingLeft = false;
let particles = [];
let blinkUntil = 0;

const ANIM_DUR = { eat: 30, play: 40, clean: 25, medicine: 20, pet: 18 };
function playAnim(type) {
  if (!type) return;
  anim = { type, t: 0, dur: ANIM_DUR[type] || 20 };
  if (type === 'pet') {
    for (let i = 0; i < 3; i++) spawn('heart', catX + 8 + Math.random() * 16, 18 + Math.random() * 6, (Math.random() - .5) * .3);
  }
}

function spawn(sprite, x, y, vx = 0, vy = -0.4, life = 20) {
  particles.push({ sprite, x, y, vx, vy, life });
}

const $msg = document.getElementById('msg');
let msgTimer;
function say(text, ms = 3500) {
  $msg.textContent = text;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => $msg.textContent = moodText(), ms);
}

function moodText() {
  const s = state;
  if (loading) return 'Conectando con el gato compartido...';
  if (s.dead) return `${s.name} se fue al cielo gatuno... 🌟`;
  if (s.sleeping) return 'Zzz... shhh, está durmiendo.';
  if (s.sick) return '¡Me siento mal! Necesito medicina.';
  if (s.poops.length >= 2) return '¡Puaj! Esto huele mal...';
  if (s.hunger < 25) return `¡Tengo hambre! ${skin.voice}...`;
  if (s.energy < 20) return 'Tengo mucho sueño...';
  if (s.happy < 25) return 'Estoy aburrido... ¿jugamos?';
  if (s.clean < 25) return 'Necesito un baño.';
  if (s.happy > 80) return `¡${skin.voice}! Estoy feliz :3`;
  return `${skin.voice}.`;
}

// Textos según el resultado de cada acción
const MSG = {
  full: () => 'No tengo hambre, gracias.',
  fed: () => '¡Ñam ñam! Pescadito 🐟',
  tired: () => 'Estoy muy cansado para jugar...',
  played: p => p.lines ? `¡${p.lines} líneas y ${p.score} puntos! ¡Qué divertido!` : 'Bueno... al menos jugamos un rato.',
  slept: () => 'Buenas noches... 🌙',
  woke: () => '¡Buenos días!',
  cleaned: () => '¡Limpiecito y brillante!',
  yuck: () => '¡Puaj! No estoy enfermo.',
  cured: () => 'Gracias... ya me siento mejor.',
  petted: () => skin.purr,
  sleeping: () => 'Zzz... (está durmiendo)',
  renamed: () => `¡Ahora me llamo ${state.name}!`,
  skin: () => `¡${skin.voice}! ¿Te gusta mi nuevo look?`,
  reset: () => `¡Hola! Soy ${state.name} :3`,
};

// Lo que se anuncia cuando la otra persona hace algo
const LOG_TEXT = {
  share: () => 'compartió el gato',
  feed: () => 'le dio de comer',
  tetris: e => `jugó Tetris (${e.lines || 0} líneas)`,
  sleep: e => e.on ? 'apagó la luz' : 'lo despertó',
  clean: () => 'lo bañó',
  medicine: () => 'le dio medicina',
  pet: () => 'lo mimó',
  rename: e => `le puso de nombre ${e.name}`,
  skin: () => 'le cambió el look',
  reset: () => 'adoptó una nueva mascota',
};
const logText = e => (LOG_TEXT[e.a] || (() => e.a))(e);
const LOG_ANIM = { feed: 'eat', tetris: 'play', clean: 'clean', medicine: 'medicine', pet: 'pet' };

// ---------- Red ----------
async function api(method, body) {
  const url = method === 'GET' ? `/api/pet?id=${ROOM}` : '/api/pet';
  const r = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.message || data.error || r.status); e.status = r.status; throw e; }
  return data;
}

let lastLogT = 0;
function setState(next, announce = true) {
  const fresh = (next.log || []).filter(e => e.t > lastLogT && e.cid !== player.cid);
  if (announce && fresh.length) {
    const e = fresh[fresh.length - 1];
    say(`${e.who} ${logText(e)}`, 4000);
    if (!next.sleeping) playAnim(LOG_ANIM[e.a]);
  }
  lastLogT = Math.max(lastLogT, ...(next.log || []).map(e => e.t));
  state = next;
  skin = getSkin(state.skin);
  updateUI();
  renderCoop();
}

let busy = false;
async function refresh() {
  if (!online || document.hidden || busy) return;
  try {
    const { state: s } = await api('GET');
    const first = loading;
    loading = false;
    setState(s, !first);
    if (first) say(`¡${skin.voice}! Hola ${playerName()} :3`);
  } catch (e) {
    if (e.status === 404) {
      say('Ese gato no existe (o expiró). Volviendo a tu gato...', 6000);
      setTimeout(() => { location.href = location.pathname; }, 2500);
    } else if (loading) {
      $msg.textContent = 'Sin conexión... reintentando.';
    }
  }
}

// ---------- Acciones ----------
async function act(action, payload = {}) {
  if (loading || busy) return;
  let result;
  if (online) {
    busy = true;
    try {
      const r = await api('POST', { op: 'act', id: ROOM, action, payload, who: playerName(), cid: player.cid });
      result = r.result;
      setState(r.state, false);
    } catch (e) {
      say('No se pudo conectar... intenta de nuevo.');
      return;
    } finally {
      busy = false;
    }
  } else {
    result = applyAction(state, action, payload);
    if (result.ok) addLog(state, playerName(), player.cid, action, Date.now(), result.log);
    skin = getSkin(state.skin);
    save();
    updateUI();
    renderCoop();
  }
  if (result.code === 'slept') anim = null;
  playAnim(result.anim);
  const m = MSG[result.code];
  if (m) say(m(payload));
}

function doAction(name) {
  if (state.dead) return;
  if (name === 'play') {
    if (state.sleeping) return say(MSG.sleeping());
    if (state.energy < 10) return say(MSG.tired());
    say('¡A jugar Tetris!');
    return Tetris.open(res => act('tetris', res));
  }
  act(name);
}

document.querySelectorAll('[data-action]').forEach(b =>
  b.addEventListener('click', () => doAction(b.dataset.action)));

let lastPetClick = 0;
cv.addEventListener('click', e => {
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W;
  if (x > catX && x < catX + 32 && Date.now() - lastPetClick > 1200) {
    lastPetClick = Date.now();
    doAction('pet');
  }
});

document.getElementById('name').addEventListener('click', () => {
  const n = prompt('¿Cómo se llama tu mascota?', state.name);
  if (n && n.trim()) act('rename', { name: n });
});

document.getElementById('reset').addEventListener('click', () => {
  const n = prompt('Nombre de tu nueva mascota:', 'Michi') || 'Michi';
  particles = []; anim = null;
  act('reset', { name: n });
});

// ---------- Cuidar juntos ----------
const coopDlg = document.getElementById('coop-dlg');
const $playerName = document.getElementById('player-name');
const shareUrl = () => `${location.origin}${location.pathname}?gato=${ROOM}`;

function renderCoop() {
  document.getElementById('coop-btn').textContent = online ? `Juntos · ${ROOM.toUpperCase()}` : 'Juntos';
  if (!coopDlg.open) return;
  document.getElementById('coop-local').hidden = online;
  document.getElementById('coop-online').hidden = !online;
  document.getElementById('coop-room').textContent = ROOM.toUpperCase();
  const ul = document.getElementById('coop-log');
  ul.innerHTML = '';
  [...(state.log || [])].reverse().slice(0, 12).forEach(e => {
    const li = document.createElement('li');
    const t = new Date(e.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    li.textContent = `${t} ${e.who} ${logText(e)}`;
    ul.append(li);
  });
  if (!ul.children.length) ul.innerHTML = '<li>Todavía no hay actividad.</li>';
}

function readPlayerName() {
  const n = $playerName.value.trim().slice(0, 16);
  if (n !== player.name) { player.name = n; savePlayer(); }
  return !!n;
}

document.getElementById('coop-btn').addEventListener('click', () => {
  $playerName.value = player.name;
  coopDlg.showModal();
  renderCoop();
});
document.getElementById('coop-close').addEventListener('click', () => { readPlayerName(); coopDlg.close(); });
$playerName.addEventListener('change', readPlayerName);

document.getElementById('coop-create').addEventListener('click', async e => {
  if (!readPlayerName()) { $playerName.focus(); return say('Primero escribe tu nombre.'); }
  e.target.disabled = true;
  try {
    const { id } = await api('POST', { op: 'create', state, who: playerName(), cid: player.cid });
    location.href = `${location.pathname}?gato=${id}`;
  } catch (err) {
    e.target.disabled = false;
    say(`No se pudo compartir: ${err.message}`, 6000);
  }
});

document.getElementById('coop-join').addEventListener('click', () => {
  if (!readPlayerName()) { $playerName.focus(); return say('Primero escribe tu nombre.'); }
  const code = document.getElementById('coop-code').value.trim().toLowerCase();
  if (!/^[a-z0-9]{6}$/.test(code)) return say('El código tiene 6 letras/números.');
  location.href = `${location.pathname}?gato=${code}`;
});

document.getElementById('coop-copy').addEventListener('click', async e => {
  try {
    await navigator.clipboard.writeText(shareUrl());
    e.target.textContent = '¡Copiado!';
  } catch (err) {
    prompt('Copia este link:', shareUrl());
  }
  setTimeout(() => { e.target.textContent = 'Copiar link'; }, 1500);
});

document.getElementById('coop-leave').addEventListener('click', () => { location.href = location.pathname; });

// ---------- UI ----------
const bars = {};
['hunger', 'happy', 'energy', 'clean', 'health'].forEach(k => {
  const el = document.getElementById('bar-' + k);
  el.innerHTML = '<i></i>'.repeat(10);
  bars[k] = el;
});

function updateUI() {
  const s = state;
  for (const k in bars) {
    const v = s[k], on = Math.ceil(v / 10);
    [...bars[k].children].forEach((seg, i) => seg.classList.toggle('on', i < on));
    bars[k].classList.toggle('low', v < 25);
    bars[k].classList.toggle('mid', v >= 25 && v < 50);
  }
  document.getElementById('name').textContent = s.name;
  const end = s.dead ? s.diedAt : Date.now();
  const hrs = Math.floor((end - s.born) / 3600000);
  document.getElementById('age').textContent = hrs < 24 ? `${hrs} h` : `${Math.floor(hrs / 24)} días`;

  const sleepBtn = document.getElementById('btn-sleep');
  sleepBtn.querySelector('span').textContent = s.sleeping ? 'Despertar' : 'Dormir';
  const ic = sleepBtn.querySelector('canvas');
  if (ic.dataset.icon !== (s.sleeping ? 'sun' : 'moon')) { ic.dataset.icon = s.sleeping ? 'sun' : 'moon'; paintIcons(); }

  document.querySelectorAll('[data-action]').forEach(b => b.disabled = s.dead);
  document.getElementById('reset').hidden = !s.dead;
}

// ---------- Render ----------
const STARS = [[6, 6, 'star'], [70, 10, 'star'], [12, 30, 'star2'], [66, 34, 'star2']];

function render() {
  const s = state;
  const night = s.sleeping;

  // Fondo
  ctx.fillStyle = night ? '#2a2550' : shell.screen;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = night ? '#1e1a3c' : shell.floor;
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.fillStyle = night ? '#3a3468' : shell.line;
  for (let x = 0; x < W; x += 6) ctx.fillRect(x, FLOOR + 3, 3, 1);
  ctx.fillRect(0, FLOOR, W, 1);

  // Destellos
  STARS.forEach(([x, y, spr], i) => {
    if (((frame >> 3) + i) % 4 !== 0) drawGrid(SPR[spr], x, y);
  });

  // Cacas
  s.poops.forEach((x, i) => {
    drawGrid(SPR.poop, x, FLOOR - 4);
    if ((frame >> 2) % 2 === i % 2) { ctx.fillStyle = '#8a7a50'; ctx.fillRect(x + 2, FLOOR - 7, 1, 2); ctx.fillRect(x + 4, FLOOR - 8, 1, 2); }
  });

  // --- Lógica de movimiento ---
  let front = null;
  let eyes = 'grumpy', mouth = null, y = FLOOR - 31, tail = (frame >> 3) % 2;
  const bob = (frame >> 2) % 2;

  if (s.dead) {
    eyes = 'dead'; mouth = 'sad';
    y = FLOOR - 33 + Math.round(Math.sin(frame / 6) * 2);
    drawGrid(buildPet(skin, eyes, mouth, 0), catX, y, false, ghostPal(skin.palette));
    drawGrid(SPR.halo, catX + 13, y - 3);
    drawParticles();
    return;
  }

  if (s.sleeping) {
    eyes = 'closed'; tail = 0; y += bob;
    if (frame % 14 === 0) spawn('z', catX + 26, y + 4, 0.15, -0.25, 30);
  } else if (anim) {
    anim.t++;
    switch (anim.type) {
      case 'eat': {
        eyes = 'happy';
        mouth = (anim.t >> 2) % 2 ? 'eat' : 'chew';
        const bites = Math.min(4, anim.t >> 3);
        front = () => drawGrid(SPR.fish.map(r => r.slice(0, 8 - bites * 2)), catX + 12, FLOOR - 5);
        break;
      }
      case 'play': {
        eyes = 'open';
        const p = (anim.t % 20) / 20;
        y -= Math.round(Math.sin(p * Math.PI) * 8);
        const bx = catX + 14 + Math.round(Math.cos(anim.t / 4) * 20);
        drawGrid(SPR.ball, Math.max(0, Math.min(W - 5, bx)), FLOOR - 5 - Math.round(Math.abs(Math.sin(anim.t / 3)) * 14));
        break;
      }
      case 'clean':
        eyes = 'happy';
        if (anim.t % 2 === 0) spawn('bubble', catX + 4 + Math.random() * 24, y + 8 + Math.random() * 20, 0, -0.5, 14);
        break;
      case 'medicine':
        eyes = anim.t < 10 ? 'closed' : 'happy';
        mouth = anim.t < 10 ? 'sad' : null;
        break;
      case 'pet':
        eyes = 'happy';
        break;
    }
    if (anim.t >= anim.dur) anim = null;
  } else {
    // Paseo libre
    if (Math.abs(catX - targetX) < 1) {
      if (Math.random() < 0.02) targetX = 2 + Math.floor(Math.random() * 44);
      y += bob;
    } else {
      facingLeft = targetX < catX;
      catX += facingLeft ? -0.5 : 0.5;
      y -= (frame >> 1) % 2;
    }
    if (s.sick) { eyes = 'sick'; mouth = 'sad'; }
    else if (s.happy > 70) eyes = 'open';
    if (Date.now() < blinkUntil) eyes = 'closed';
    else if (Math.random() < 0.01) blinkUntil = Date.now() + 150;
  }

  drawGrid(buildPet(skin, eyes, mouth, tail), catX, y, facingLeft, skin.palette);
  if (front) front();

  if (s.sick && !s.sleeping) drawGrid(SPR.skull, catX + 30, y + 2 + bob);

  drawParticles();

  // Oscurece en la noche
  if (night) {
    ctx.fillStyle = 'rgba(20,16,50,0.35)';
    ctx.fillRect(0, 0, W, H);
  }
}

function drawParticles() {
  particles = particles.filter(p => p.life-- > 0);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    drawGrid(SPR[p.sprite], p.x, p.y);
  });
}

// ---------- Selector de estilo ----------
const styleDlg = document.getElementById('style-dlg');

function renderStylePicker() {
  const skinList = document.getElementById('skin-list');
  skinList.innerHTML = '';
  SKINS.forEach(sk => {
    const b = document.createElement('button');
    b.className = 'choice' + (sk.id === skin.id ? ' selected' : '');
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    drawGrid(buildPet(sk, 'open', null, 0), 0, 0, false, sk.palette, c.getContext('2d'));
    b.append(c, sk.name);
    b.addEventListener('click', () => {
      style.skin = sk.id; saveStyle();
      act('skin', { skin: sk.id }).then(renderStylePicker);
    });
    skinList.append(b);
  });

  const shellList = document.getElementById('shell-list');
  shellList.innerHTML = '';
  SHELLS.forEach(sh => {
    const b = document.createElement('button');
    b.className = 'choice' + (sh.id === shell.id ? ' selected' : '');
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = sh.shell;
    sw.style.boxShadow = `inset -4px -4px 0 ${sh.dark}, inset 4px 4px 0 ${sh.light}`;
    const inner = document.createElement('i');
    inner.style.background = sh.screen;
    inner.style.borderColor = sh.border;
    sw.append(inner);
    b.append(sw, sh.name);
    b.addEventListener('click', () => {
      shell = sh; style.shell = sh.id; saveStyle();
      applyShell(sh);
      renderStylePicker();
    });
    shellList.append(b);
  });
}

document.getElementById('style-btn').addEventListener('click', () => {
  renderStylePicker();
  styleDlg.showModal();
});
document.getElementById('style-close').addEventListener('click', () => styleDlg.close());

// ---------- Bucle ----------
paintIcons();
updateUI();
say(moodText(), 100);

setInterval(() => {
  frame++;
  render();
}, 100);

setInterval(() => {
  const before = state.dead;
  if (!online && catchUp(state)) save();
  updateUI();
  if (!before && state.dead) say(moodText(), 999999);
}, 1000);

// Mensajes de estado de vez en cuando
setInterval(() => { if (!anim) $msg.textContent = moodText(); }, 8000);

// Multijugador: pedir el estado al servidor cada pocos segundos
renderCoop();
if (online) {
  refresh();
  setInterval(refresh, 6000);
  document.addEventListener('visibilitychange', refresh);
}
