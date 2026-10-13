// ===== Skins (mascotas) y carcasas =====

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

const rev = s => [...s].reverse().join('');

// onlyEmpty: solo pinta donde no hay nada (para cosas que van "detrás")
function overlay(m, pat, x, y, onlyEmpty = false) {
  pat.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.' || !m[y + r] || m[y + r][x + c] === undefined) return;
    if (onlyEmpty && m[y + r][x + c] !== '.') return;
    m[y + r][x + c] = ch;
  }));
}

// Ojos 6x4 (ojo izquierdo; el derecho se refleja). '.' = no tocar
const EYES = {
  open:   ['.KKKK.', 'KWYYKK', 'KYYYKK', '.KKKK.'],
  grumpy: ['......', 'KKKKKK', 'KYYYKK', '.KKKK.'],
  closed: ['......', '......', 'KKKKKK', '......'],
  happy:  ['......', '..KK..', '.K..K.', 'K....K'],
  sick:   ['......', 'KKKKKK', '.KYYK.', '..KK..'],
  dead:   ['.K..K.', '..KK..', '..KK..', '.K..K.'],
};

// Boca 4x3
const MOUTHS = {
  eat:  ['.KK.', 'KRRK', '.KK.'],
  chew: ['....', 'KKKK', '....'],
  sad:  ['....', '.KK.', 'K..K'],
};

// ---------- Gato marciano (mitad izquierda, se refleja) ----------
const CAT_HALF = [
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
const CAT_TAIL = [
  ['.....KK', '....KDK', '....KDK', '....KGK', '....KGK', '...KGK.', '...KGK.', '..KGK..', '.KGK...', 'GGK....', 'KK.....'],
  ['....KK.', '...KDK.', '...KDK.', '....KGK', '....KGK', '...KGK.', '...KGK.', '..KGK..', '.KGK...', 'GGK....', 'KK.....'],
];

// ---------- Armadurita chibi (cabeza azul) ----------
const CHIBI_HALF = [
  '...............K',
  '..............KA',
  '..............KA',
  '.............KAA',
  '...........KKAAA',
  '.........KKAAAAA',
  '........KAAAAAAA',
  '.......KAAAAAAAA',
  '......KAAAAAAAAA',
  '.....KAAAAAAAAAA',
  '....KAAAAAAAAAAA',
  '....KAAAAAAAAAAA',
  '...KAAAAAAAAAAAA',
  '...KAAAAAAAAAAAA',
  '...KAAAAAAAAAAAA',
  '...KAAAAAAAAAAAA',
  '...KAAAAAAAAAAAA',
  '...KAAAAAAAAAAAA',
  '...KAAARARARAAAA',
  '...KAAAAAAAAAAAA',
  '...KAAAAAAAAAAAA',
  '...KAAAKKAAKKAAK',
  '...KAAKAAKKAAKKA',
  '...KAAAAAAAAAAAA',
  '...KaAAAAAAAAAAA',
  '....KaAAAAAAAAAA',
  '.....KaaAAAAAAAA',
  '......KKaaaaaaaa',
  '........KKKKKKKK',
  '.......KAAAK....',
  '.......KaaaK....',
  '.......KKKKK....',
];

// ---------- Armadura (gris, con penacho) ----------
const ARMOR_HALF = [
  '...............K',
  '..............KL',
  '..........KKKKLL',
  '........KKGGGKLL',
  '.......KGGLGGKLL',
  '......KGGLGGGKLH',
  '......KGLGGGGKLH',
  '.....KGGLGGGGKLL',
  '.....KGLGGGGGGKK',
  '.....KGLGGGGGGGD',
  '.....KGGGGGGGGDD',
  '....KDGGGGGGGGGD',
  '....KDGGGGGGGGGG',
  '....KDGGEEEEEEGG',
  '....KDGGEEEEEEGG',
  '....KDGGEEEEEEGG',
  '....KDGGEEEEEEGG',
  '....KDGGGGGGGGGG',
  '....KDGDDGGGGGGG',
  '....KDGGGGGGGGGG',
  '....KDGDDGGGGGGG',
  '....KDGGGDGGGGGG',
  '....KDGGGDEEEEEE',
  '...KKDGGGGGGGGGG',
  '..KLLKDGGGGGGGGG',
  '.KLLLLKDDGGGGEEE',
  '.KLHLLLKKDDEEKKK',
  'KLHLLLLKKKKKKKKK',
  'KLHLLGLKKKKLLLLL',
  'KLHLLGLKKKLKLKLK',
  'KLHLLGLKKKLLLLLL',
  'KKKKKKKKKKKKKKKK',
];
const PLUME = [
  'PP.............', '..PP...........', '....PP.........', '......PP.......',
  '.......PP......', '.........PP....', '..........PP...', '...........PP..',
  '...........PP..', '............PP.', '............PP.', '............PP.',
  '.............PP', '.............PP', '.............PP', '..............P',
];
const PLUME_2 = PLUME.map((r, i) => i >= 9 ? r.slice(1) + '.' : r);

// Ojos brillantes dentro del casco
const ARMOR_EYES = {
  open:   ['EEEEEE', 'EYYYYE', 'EYYYKE', 'EEEEEE'],
  grumpy: ['EEEEEE', 'KKKKKE', 'EYYYYE', 'EEEEEE'],
  closed: ['EEEEEE', 'EEEEEE', 'EKKKKE', 'EEEEEE'],
  happy:  ['EEEEEE', 'EEYYEE', 'EYEEYE', 'EEEEEE'],
  sick:   ['EEEEEE', 'KKKKKK', 'EEYYEE', 'EEEEEE'],
  dead:   ['EEEEEE', 'EEEEEE', 'EEEEEE', 'EEEEEE'],
};

const CAT = { half: CAT_HALF, eyeX: 5, eyeY: 14, mouthX: 14, mouthY: 19, extra: { x: 25, y: 19, frames: CAT_TAIL }, voice: 'Miau', purr: 'Purrr... purrr...' };

const SKINS = [
  { id: 'marciano', name: 'Marciano', ...CAT, pal: {} },
  { id: 'naranja', name: 'Naranja', ...CAT,
    pal: { G: '#f2a65a', L: '#f8c98a', D: '#d9773a', E: '#a85428', Y: '#7ad0f0' } },
  { id: 'nocturno', name: 'Nocturno', ...CAT,
    pal: { K: '#0d0c14', G: '#3f3b56', L: '#58537a', D: '#8a7fd0', E: '#2a2740', Y: '#f4e04d' } },
  { id: 'chibi', name: 'Armadurita', half: CHIBI_HALF, eyeX: 6, eyeY: 14, mouthX: 14, mouthY: 21,
    voice: 'Clink', purr: '*clink clink* jeje',
    pal: { A: '#a9bdf0', a: '#7f93cc', Y: '#ffffff', R: '#e83a3a' } },
  { id: 'armadura', name: 'Armadura', half: ARMOR_HALF, eyeX: 8, eyeY: 13, mouthX: 14, mouthY: 21,
    eyes: ARMOR_EYES, extra: { x: 17, y: 0, frames: [PLUME, PLUME_2], behind: true },
    voice: 'Clank', purr: '*clank* ...gracias.',
    pal: { K: '#111116', G: '#7a7a7a', L: '#a6a6a6', H: '#cfcfcf', D: '#4a4a4a', E: '#262626', Y: '#ffffff', P: '#dadada' } },
];
SKINS.forEach(s => {
  s.base = s.half.map(r => r + rev(r));
  s.palette = { ...PAL, ...s.pal };
});

function getSkin(id) { return SKINS.find(s => s.id === id) || SKINS[0]; }

function buildPet(skin, eyes, mouth, frame = 0) {
  const m = skin.base.map(r => [...r]);
  const E = (skin.eyes || EYES)[eyes] || EYES[eyes];
  overlay(m, E, skin.eyeX, skin.eyeY);
  overlay(m, E.map(rev), 31 - skin.eyeX - 5, skin.eyeY);
  if (eyes === 'dead' && skin.eyes) {           // la armadura muerta: ojos apagados + X
    overlay(m, EYES.dead.map(r => r.replace(/K/g, 'D')), skin.eyeX, skin.eyeY);
    overlay(m, EYES.dead.map(r => r.replace(/K/g, 'D')), 31 - skin.eyeX - 5, skin.eyeY);
  }
  if (mouth) overlay(m, MOUTHS[mouth], skin.mouthX, skin.mouthY);
  if (skin.extra) {
    const ex = skin.extra;
    overlay(m, ex.frames[frame % ex.frames.length], ex.x, ex.y, ex.behind);
  }
  return m.map(r => r.join(''));
}

// Paleta de fantasma: todo a gris claro, menos el contorno
function ghostPal(pal) {
  const out = {};
  for (const k in pal) {
    if (k === 'K') { out[k] = '#6a6a80'; continue; }
    const n = parseInt(pal[k].slice(1), 16);
    const g = ((n >> 16 & 255) * .3 + (n >> 8 & 255) * .59 + (n & 255) * .11);
    const v = Math.round(180 + g / 255 * 70);
    out[k] = `rgb(${v},${v},${Math.min(255, v + 12)})`;
  }
  return out;
}

// ---------- Carcasas ----------
const SHELLS = [
  { id: 'uva',     name: 'Uva',        shell: '#8f7bd8', dark: '#5c4aa6', light: '#b8a9f0', border: '#3a3060', inner: '#4d4180', bg: '#2b2346', screen: '#e9e4ff', floor: '#c9bff0', line: '#b3a6e8' },
  { id: 'chicle',  name: 'Chicle',     shell: '#f29bc4', dark: '#c9649a', light: '#ffc6e0', border: '#6b2f52', inner: '#8a4470', bg: '#3d2233', screen: '#fff0f6', floor: '#f6cfe0', line: '#eab3cc' },
  { id: 'menta',   name: 'Menta',      shell: '#6fd3b0', dark: '#3f9e80', light: '#a8f0d6', border: '#1f5a4a', inner: '#2e7462', bg: '#183530', screen: '#eafaf3', floor: '#c4ecdc', line: '#a6dcc6' },
  { id: 'banana',  name: 'Banana',     shell: '#f4d35e', dark: '#c9a227', light: '#fff0a8', border: '#6b5410', inner: '#8a7020', bg: '#33290f', screen: '#fffbe8', floor: '#f3e6b0', line: '#e5d38f', label: '#1b1b2a', labelShadow: '#fff0a8' },
  { id: 'retro',   name: 'Retro',      shell: '#c8c8c0', dark: '#96968c', light: '#e8e8e0', border: '#55556a', inner: '#6a6a80', bg: '#2a2a30', screen: '#c4cfa1', floor: '#a7b582', line: '#8b9a6a', label: '#1b1b2a', labelShadow: '#e8e8e0' },
  { id: 'noche',   name: 'Medianoche', shell: '#3a3a4a', dark: '#22222e', light: '#5a5a70', border: '#111118', inner: '#2a2a38', bg: '#0f0f16', screen: '#dfe3f0', floor: '#bcc2d8', line: '#a3aac4' },
];

function getShell(id) { return SHELLS.find(s => s.id === id) || SHELLS[0]; }

function applyShell(sh) {
  const st = document.documentElement.style;
  st.setProperty('--shell', sh.shell);
  st.setProperty('--shell-dark', sh.dark);
  st.setProperty('--shell-light', sh.light);
  st.setProperty('--screen-border', sh.border);
  st.setProperty('--inner', sh.inner);
  st.setProperty('--bg', sh.bg);
  st.setProperty('--screen', sh.screen);
  st.setProperty('--label', sh.label || '#f4f0ff');
  st.setProperty('--label-shadow', sh.labelShadow || '#1b1b2a');
}
