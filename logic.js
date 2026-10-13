// ===== Reglas del juego (compartidas entre navegador y servidor) =====

export const MINUTE = 60 * 1000;
export const STATS = ['hunger', 'happy', 'energy', 'clean'];
export const SKIN_IDS = [
  'marciano', 'atigrado', 'pelirrojo', 'blanco', 'negro', 'siames', 'azul',
  'naranja', 'nocturno', 'chibi', 'armadura',
];
const MAX_CATCHUP = 4320; // 3 días en minutos

export const clamp = v => Math.max(0, Math.min(100, v));
const randPoop = () => 4 + Math.floor(Math.random() * 68);
export const cleanName = n => String(n || '').trim().slice(0, 12) || 'Michi';

export function newPet(name = 'Michi', skin = 'marciano', now = Date.now()) {
  return {
    name: cleanName(name), skin: SKIN_IDS.includes(skin) ? skin : 'marciano',
    born: now, last: now,
    hunger: 80, happy: 80, energy: 80, clean: 90, health: 100,
    sleeping: false, sick: false, dead: false, poops: [], log: [],
  };
}

// Un minuto de vida
export function stepMinute(s, now = Date.now()) {
  if (s.dead) return;
  if (s.sleeping) {
    s.energy += 4; s.hunger -= 0.7; s.happy -= 0.2;
  } else {
    s.energy -= 0.8; s.hunger -= 1.5; s.happy -= 1;
  }
  s.clean -= 0.4 + s.poops.length * 0.8;

  if (!s.sleeping && s.poops.length < 3 && Math.random() < 0.04) s.poops.push(randPoop());
  if (!s.sick && (s.poops.length >= 3 || s.clean < 15 || s.hunger < 10) && Math.random() < 0.06) {
    s.sick = true;
  }

  const zeros = STATS.filter(k => s[k] <= 0).length;
  let dano = (s.sick ? 1.5 : 0) + zeros * 2;
  s.health -= Math.min(dano, 0.15); // tope: 5.5 h mínimo de vida
  if (!s.sick && STATS.every(k => s[k] > 50)) s.health += 1;

  clampAll(s);

  if (s.sleeping && s.energy >= 100) s.sleeping = false;
  if (s.health <= 0) { s.dead = true; s.sleeping = false; s.diedAt = now; }
}

function clampAll(s) {
  STATS.forEach(k => s[k] = clamp(s[k]));
  s.health = clamp(s.health);
}

// Avanza el tiempo pendiente. Devuelve true si cambió algo.
export function catchUp(s, now = Date.now()) {
  let changed = false;
  if (s.poopAt && s.poopAt <= now) {
    if (!s.dead && s.poops.length < 3) s.poops.push(randPoop());
    delete s.poopAt;
    changed = true;
  }
  let mins = Math.floor((now - s.last) / MINUTE);
  if (mins > MAX_CATCHUP) { s.last = now - MAX_CATCHUP * MINUTE; mins = MAX_CATCHUP; }
  for (let i = 0; i < mins; i++) stepMinute(s, now);
  s.last += mins * MINUTE;
  return changed || mins > 0;
}

// Aplica una acción. Devuelve { ok, code, anim?, log? }
export function applyAction(s, action, payload = {}, now = Date.now()) {
  if (action === 'rename') {
    s.name = cleanName(payload.name);
    return { ok: true, code: 'renamed', log: { name: s.name } };
  }
  if (action === 'skin') {
    if (!SKIN_IDS.includes(payload.skin)) return { ok: false, code: 'unknown' };
    s.skin = payload.skin;
    return { ok: true, code: 'skin' };
  }
  if (action === 'reset') {
    if (!s.dead) return { ok: false, code: 'alive' };
    const fresh = newPet(payload.name, s.skin, now);
    fresh.log = s.log || [];
    Object.keys(s).forEach(k => delete s[k]);
    Object.assign(s, fresh);
    return { ok: true, code: 'reset' };
  }

  if (s.dead) return { ok: false, code: 'dead' };
  if (s.sleeping && action !== 'sleep') return { ok: false, code: 'sleeping' };

  let r;
  switch (action) {
    case 'feed':
      if (s.hunger > 92) { s.happy -= 3; r = { ok: true, code: 'full' }; break; }
      s.hunger += 25; s.happy += 3;
      if (Math.random() < 0.3 && s.poops.length < 3 && !s.poopAt) s.poopAt = now + 8000;
      r = { ok: true, code: 'fed', anim: 'eat' };
      break;
    case 'tetris': {
      if (s.energy < 10) { r = { ok: false, code: 'tired' }; break; }
      const lines = Math.max(0, Math.min(500, Math.floor(Number(payload.lines) || 0)));
      s.happy += Math.min(50, 8 + lines * 6);
      s.energy -= 6 + Math.min(14, lines);
      s.hunger -= 5;
      r = { ok: true, code: 'played', anim: 'play', log: { lines } };
      break;
    }
    case 'sleep':
      s.sleeping = !s.sleeping;
      if (!s.sleeping && s.energy < 60) s.happy -= 5;
      r = { ok: true, code: s.sleeping ? 'slept' : 'woke', log: { on: s.sleeping } };
      break;
    case 'clean':
      s.poops = []; s.clean = 100; s.happy += 2;
      delete s.poopAt;
      r = { ok: true, code: 'cleaned', anim: 'clean' };
      break;
    case 'medicine':
      if (!s.sick) { s.happy -= 10; r = { ok: true, code: 'yuck' }; break; }
      s.sick = false; s.health += 30;
      r = { ok: true, code: 'cured', anim: 'medicine' };
      break;
    case 'pet':
      if (now - (s.lastPet || 0) > 2000) s.happy += 4;
      s.lastPet = now;
      r = { ok: true, code: 'petted', anim: 'pet' };
      break;
    default:
      return { ok: false, code: 'unknown' };
  }
  clampAll(s);
  return r;
}

// Historial de quién hizo qué (últimas 20 entradas)
export function addLog(s, who, cid, a, now = Date.now(), extra = {}) {
  const log = s.log || [];
  const last = log[log.length - 1];
  if (a === 'pet' && last && last.cid === cid && last.a === 'pet' && now - last.t < 30000) {
    last.t = now;               // no llenar el historial de mimos seguidos
  } else {
    log.push({ who, cid, a, t: now, ...extra });
  }
  s.log = log.slice(-20);
}

// Limpia un estado que viene de afuera (al compartir un gato local)
export function sanitize(input, now = Date.now()) {
  const src = input && typeof input === 'object' ? input : {};
  const s = newPet(src.name, src.skin, now);
  const num = (v, d) => (Number.isFinite(v) ? v : d);
  [...STATS, 'health'].forEach(k => { s[k] = clamp(num(src[k], s[k])); });
  s.born = Math.min(now, num(src.born, now));
  s.last = Math.min(now, Math.max(s.born, num(src.last, now)));
  s.sleeping = !!src.sleeping;
  s.sick = !!src.sick;
  s.dead = !!src.dead;
  if (s.dead) s.diedAt = Math.min(now, num(src.diedAt, now));
  s.poops = Array.isArray(src.poops)
    ? src.poops.filter(Number.isFinite).slice(0, 3).map(x => Math.max(0, Math.min(73, Math.round(x))))
    : [];
  return s;
}
