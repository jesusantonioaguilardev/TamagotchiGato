// ===== Tamagotchi Gato — pixel art =====

const PAL = {
  K: '#1b1b2a', // contorno
  G: '#8fd16a', // verde base
  L: '#b9ec8f', // verde claro
  D: '#2fa37c', // verde azulado (manchas)
  E: '#1e6e55', // verde oscuro (sombra)
  Y: '#f4e04d', // amarillo
  W: '#ffffff',
  R: '#e85a6b',
  O: '#f39a3c',
  B: '#7a5230',
  S: '#6fb8f0',
  P: '#c9bff0',
};

// Gris para cuando la mascota muere
const GHOST = { ...PAL, G: '#d8d8e8', L: '#eeeef8', D: '#b0b0c8', E: '#9090a8', Y: '#ffffff' };

// ---------- Sprite del gato (mitad izquierda, se refleja) ----------
const HALF = [
  '...KKK..........',
  '..KYYYK.........',
  '..KYYGK.........',
  '...KGGK.........',
  '....KGGK........',
  '.....KGGK.......',
  '......KGK.......',
  '.......KGK......',
  '.KK..KKKGKKKKKKK',
  '.KYKKGGGGGGGGGGG',
  '.KYYGGGGGGGGGGGG',
  '.KGYGGGGGGLLLLLL',
  '..KGGGGGGGLLLLLL',
  '..KGGGGGGGGGGGGG',
  '..KGGGGGGGGGGGGG',
  '..KGGGGGGGGGGGGG',
  '..KGGGGGGGGGGGGG',
  '..KGGGGGGGGGGGGG',
  '..KGDGDGGGGGGGGE',
  '..KGGDGGGGGGGEGE',
  '..KGGGGGGGGGGGEG',
  '...KGGGGGGGGGGGG',
  '....KKKKGGGGGGGG',
  '.......KGGGGGGGG',
  '......KEGGGGLLLL',
  '......KEGGGLLLLL',
  '......KEGEGLLLLL',
  '......KEGEGLLLLL',
  '......KEGEGGLLLL',
  '......KEGGGGGGKL',
  '......KEEGGGGGKK',
  '.......KKKKKKKK.',
];
const rev = s => [...s].reverse().join('');
const BASE = HALF.map(r => r + rev(r));

// Ojos 6x4 (ojo izquierdo; el derecho se refleja). '.' = no tocar
const EYES = {
  open:   ['.KKKK.', 'KWYYKK', 'KYYYKK', '.KKKK.'],
  grumpy: ['......', 'KKKKKK', 'KYYYKK', '.KKKK.'],   // la mirada de la referencia
  closed: ['......', '......', 'KKKKKK', '......'],
  happy:  ['......', '..KK..', '.K..K.', 'K....K'],
  sick:   ['......', 'KKKKKK', '.KYYK.', '..KK..'],
  dead:   ['.K..K.', '..KK..', '..KK..', '.K..K.'],
};

// Boca 4x3 sobre columnas 14-17, filas 19-21
const MOUTHS = {
  eat:  ['.KK.', 'KRRK', '.KK.'],
  chew: ['....', 'KKKK', '....'],
  sad:  ['....', '.KK.', 'K..K'],
};

// Cola (7 de ancho, desde columna 25, fila 19) — dos frames
const TAILS = [
  ['.....KK', '....KDK', '....KDK', '....KGK', '....KGK', '...KGK.', '...KGK.', '..KGK..', '.KGK...', 'GGK....', 'KK.....'],
  ['....KK.', '...KDK.', '...KDK.', '....KGK', '....KGK', '...KGK.', '...KGK.', '..KGK..', '.KGK...', 'GGK....', 'KK.....'],
];

function overlay(m, pat, x, y) {
  pat.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') m[y + r][x + c] = ch; }));
}

function buildCat(eyes, mouth, tail) {
  const m = BASE.map(r => [...r]);
  overlay(m, EYES[eyes], 5, 14);
  overlay(m, EYES[eyes].map(rev), 21, 14);
  if (mouth) overlay(m, MOUTHS[mouth], 14, 19);
  overlay(m, TAILS[tail], 25, 19);
  return m.map(r => r.join(''));
}

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
const MINUTE = 60 * 1000;
const STATS = ['hunger', 'happy', 'energy', 'clean'];

function newPet(name = 'Michi') {
  return {
    name, born: Date.now(), last: Date.now(),
    hunger: 80, happy: 80, energy: 80, clean: 90, health: 100,
    sleeping: false, sick: false, dead: false, poops: [],
  };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s.born === 'number') return s;
  } catch (e) {}
  return newPet();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

const clamp = v => Math.max(0, Math.min(100, v));

// Un minuto de vida
function stepMinute(s) {
  if (s.dead) return;
  if (s.sleeping) {
    s.energy += 4; s.hunger -= 0.7; s.happy -= 0.2;
  } else {
    s.energy -= 0.8; s.hunger -= 1.5; s.happy -= 1;
  }
  s.clean -= 0.4 + s.poops.length * 0.8;

  if (!s.sleeping && s.poops.length < 3 && Math.random() < 0.04) {
    s.poops.push(4 + Math.floor(Math.random() * 68));
  }
  if (!s.sick && (s.poops.length >= 3 || s.clean < 15 || s.hunger < 10) && Math.random() < 0.06) {
    s.sick = true;
  }

  const zeros = STATS.filter(k => s[k] <= 0).length;
  let dano = (s.sick ? 1.5 : 0) + zeros * 2;
  s.health -= Math.min(dano, 0.15); // tope: 5.5 h mínimo de vida
  if (!s.sick && STATS.every(k => s[k] > 50)) s.health += 1;

  STATS.forEach(k => s[k] = clamp(s[k]));
  s.health = clamp(s.health);

  if (s.sleeping && s.energy >= 100) s.sleeping = false;
  if (s.health <= 0) { s.dead = true; s.sleeping = false; s.diedAt = Date.now(); }
}

// Recupera el tiempo que la página estuvo cerrada (máx. 3 días)
function catchUp() {
  const now = Date.now();
  let mins = Math.floor((now - state.last) / MINUTE);
  if (mins > 4320) { state.last = now - 4320 * MINUTE; mins = 4320; }
  for (let i = 0; i < mins; i++) stepMinute(state);
  state.last += mins * MINUTE;
}

let state = load();
catchUp();
save();

// ---------- Animación y efectos ----------
let frame = 0;
let anim = null;               // { type, t, dur }
let catX = 24, targetX = 24, facingLeft = false;
let particles = [];
let blinkUntil = 0;
let lastPet = 0;

function startAnim(type, dur) { anim = { type, t: 0, dur }; }

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
  if (s.dead) return `${s.name} se fue al cielo gatuno... 🌟`;
  if (s.sleeping) return 'Zzz... shhh, está durmiendo.';
  if (s.sick) return '¡Me siento mal! Necesito medicina.';
  if (s.poops.length >= 2) return '¡Puaj! Esto huele mal...';
  if (s.hunger < 25) return '¡Tengo hambre! Miau...';
  if (s.energy < 20) return 'Tengo mucho sueño...';
  if (s.happy < 25) return 'Estoy aburrido... ¿jugamos?';
  if (s.clean < 25) return 'Necesito un baño.';
  if (s.happy > 80) return '¡Miau! Estoy feliz :3';
  return 'Miau.';
}

// ---------- Acciones ----------
const actions = {
  feed() {
    if (state.hunger > 92) { state.happy -= 3; return say('No tengo hambre, gracias.'); }
    state.hunger += 25; state.happy += 3;
    if (Math.random() < 0.3 && state.poops.length < 3) setTimeout(() => { if (!state.dead) state.poops.push(4 + Math.floor(Math.random() * 68)); save(); }, 8000);
    startAnim('eat', 30);
    say('¡Ñam ñam! Pescadito 🐟');
  },
  play() {
    if (state.energy < 10) return say('Estoy muy cansado para jugar...');
    state.happy += 20; state.energy -= 10; state.hunger -= 5;
    startAnim('play', 40);
    say('¡Wiii! ¡La pelota!');
  },
  sleep() {
    state.sleeping = !state.sleeping;
    if (state.sleeping) { anim = null; say('Buenas noches... 🌙'); }
    else { state.happy -= state.energy < 60 ? 5 : 0; say('¡Buenos días!'); }
  },
  clean() {
    state.poops = []; state.clean = 100; state.happy += 2;
    startAnim('clean', 25);
    say('¡Limpiecito y brillante!');
  },
  medicine() {
    if (!state.sick) { state.happy -= 10; return say('¡Puaj! No estoy enfermo.'); }
    state.sick = false; state.health += 30;
    startAnim('medicine', 20);
    say('Gracias... ya me siento mejor.');
  },
  pet() {
    const now = Date.now();
    if (now - lastPet > 2000) state.happy += 4;
    lastPet = now;
    startAnim('pet', 18);
    for (let i = 0; i < 3; i++) spawn('heart', catX + 8 + Math.random() * 16, 18 + Math.random() * 6, (Math.random() - .5) * .3);
    say('Purrr... purrr...');
  },
};

function doAction(name) {
  if (state.dead) return;
  if (state.sleeping && name !== 'sleep') return say('Zzz... (está durmiendo)');
  actions[name]();
  STATS.forEach(k => state[k] = clamp(state[k]));
  state.health = clamp(state.health);
  save();
  updateUI();
}

document.querySelectorAll('[data-action]').forEach(b =>
  b.addEventListener('click', () => doAction(b.dataset.action)));

cv.addEventListener('click', e => {
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * W;
  if (x > catX && x < catX + 32) doAction('pet');
});

document.getElementById('name').addEventListener('click', () => {
  const n = prompt('¿Cómo se llama tu gato?', state.name);
  if (n && n.trim()) { state.name = n.trim().slice(0, 12); save(); updateUI(); }
});

document.getElementById('reset').addEventListener('click', () => {
  const n = prompt('Nombre de tu nueva mascota:', 'Michi') || 'Michi';
  state = newPet(n.trim().slice(0, 12) || 'Michi');
  particles = []; anim = null;
  save(); updateUI();
  say(`¡Hola! Soy ${state.name} :3`);
});

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
  ctx.fillStyle = night ? '#2a2550' : '#e9e4ff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = night ? '#1e1a3c' : '#c9bff0';
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.fillStyle = night ? '#3a3468' : '#b3a6e8';
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
    drawGrid(buildCat(eyes, mouth, 0), catX, y, false, GHOST);
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

  drawGrid(buildCat(eyes, mouth, tail), catX, y, facingLeft);
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
  if (Date.now() - state.last >= MINUTE) { catchUp(); save(); }
  updateUI();
  if (!before && state.dead) say(moodText(), 999999);
}, 1000);

// Mensajes de estado de vez en cuando
setInterval(() => { if (!anim) $msg.textContent = moodText(); }, 8000);
