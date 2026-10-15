// Almacén de gatos compartidos y partidas 1 vs 1.
// En Vercel usa Upstash Redis; en local (sin variables de entorno) usa memoria.

const TTL = 60 * 60 * 24 * 60; // gatos: se borran tras 60 días sin actividad
const ROOM_TTL = 120;          // presencia e invitaciones de una sala
const MATCH_TTL = 600;         // partidas y buzones

// Escribe solo si la versión no cambió desde que la leímos (evita que
// dos acciones simultáneas se pisen).
const CAS = `
local v = redis.call('HGET', KEYS[1], 'v')
if (v or '') ~= ARGV[1] then return 0 end
redis.call('HSET', KEYS[1], 'data', ARGV[2], 'v', ARGV[3])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[4]))
return 1`;

// Marca que alguien está conectado y devuelve toda la sala (un solo comando)
const TOUCH = `
redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[3]))
return redis.call('HGETALL', KEYS[1])`;

// Deja mensajes en el buzón del rival y recoge los propios (un solo comando)
const SYNC = `
if #ARGV > 1 then
  for i = 2, #ARGV do redis.call('RPUSH', KEYS[1], ARGV[i]) end
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
end
local mine = redis.call('LRANGE', KEYS[2], 0, -1)
redis.call('DEL', KEYS[2])
return mine`;

let cached;

export async function getStore() {
  if (cached) return cached;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url, token, automaticDeserialization: false });
    cached = makeStore({
      async read(key) {
        const h = await redis.hgetall(key);
        return h && h.data ? { data: h.data, v: String(h.v) } : null;
      },
      async cas(key, expected, data, v) {
        const ok = await redis.eval(CAS, [key], [expected, data, v, String(TTL)]);
        return Number(ok) === 1;
      },
      async touch(key, field, value) {
        const flat = await redis.eval(TOUCH, [key], [field, value, String(ROOM_TTL)]);
        const out = {};
        for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
        return out;
      },
      async hset(key, field, value) {
        await redis.hset(key, { [field]: value });
        await redis.expire(key, ROOM_TTL);
      },
      async hget(key, field) { return redis.hget(key, field); },
      async hdel(key, field) { await redis.hdel(key, field); },
      async set(key, value) { await redis.set(key, value, { ex: MATCH_TTL }); },
      async get(key) { return redis.get(key); },
      async sync(outKey, msgs, inKey) {
        return redis.eval(SYNC, [outKey, inKey], [String(MATCH_TTL), ...msgs]);
      },
      async push(key, msgs) {
        await redis.rpush(key, ...msgs);
        await redis.expire(key, MATCH_TTL);
      },
    });
    return cached;
  }

  if (process.env.VERCEL) {
    throw new Error('Falta conectar Upstash Redis al proyecto (KV_REST_API_URL / KV_REST_API_TOKEN).');
  }

  // Solo para desarrollo local: se pierde al reiniciar (sin caducidad)
  const mem = globalThis.__petMem || (globalThis.__petMem = new Map());
  const hash = key => { if (!mem.has(key)) mem.set(key, {}); return mem.get(key); };
  cached = makeStore({
    async read(key) { return mem.get(key) || null; },
    async cas(key, expected, data, v) {
      if ((mem.get(key)?.v || '') !== expected) return false;
      mem.set(key, { data, v });
      return true;
    },
    async touch(key, field, value) { const h = hash(key); h[field] = value; return { ...h }; },
    async hset(key, field, value) { hash(key)[field] = value; },
    async hget(key, field) { return hash(key)[field] ?? null; },
    async hdel(key, field) { delete hash(key)[field]; },
    async set(key, value) { mem.set(key, value); },
    async get(key) { return mem.get(key) ?? null; },
    async sync(outKey, msgs, inKey) {
      if (msgs.length) mem.set(outKey, [...(mem.get(outKey) || []), ...msgs]);
      const mine = mem.get(inKey) || [];
      mem.delete(inKey);
      return mine;
    },
    async push(key, msgs) { mem.set(key, [...(mem.get(key) || []), ...msgs]); },
  });
  return cached;
}

function makeStore(db) {
  return {
    // ----- Gatos -----
    // Crea un gato nuevo; falla (false) si el id ya existe
    create(id, state) {
      return db.cas('pet:' + id, '', JSON.stringify(state), '1');
    },
    // Lee, modifica con fn y guarda. fn devuelve true si hay que guardar.
    async update(id, fn) {
      const key = 'pet:' + id;
      for (let i = 0; i < 6; i++) {
        const cur = await db.read(key);
        if (!cur) return null;
        const state = JSON.parse(cur.data);
        if (!fn(state)) return { state };
        if (await db.cas(key, cur.v, JSON.stringify(state), String(Number(cur.v) + 1))) return { state };
      }
      throw new Error('Demasiados cambios a la vez, intenta de nuevo.');
    },

    // ----- Sala: quién está conectado e invitaciones -----
    // Campos: "p:<cid>" = { who, t }   "i:<cid>" = invitación para ese jugador
    async touchRoom(room, cid, who) {
      const all = await db.touch('room:' + room, 'p:' + cid, JSON.stringify({ who, t: Date.now() }));
      const now = Date.now();
      const online = [];
      let invite = null;
      for (const [k, v] of Object.entries(all)) {
        let val;
        try { val = JSON.parse(v); } catch { continue; }
        if (k.startsWith('p:') && k.slice(2) !== cid && now - val.t < 20000) online.push({ cid: k.slice(2), who: val.who });
        if (k === 'i:' + cid && now - val.t < 60000) invite = val;
      }
      return { online, invite };
    },
    setInvite(room, toCid, invite) { return db.hset('room:' + room, 'i:' + toCid, JSON.stringify(invite)); },
    async getInvite(room, toCid) {
      const v = await db.hget('room:' + room, 'i:' + toCid);
      return v ? JSON.parse(v) : null;
    },
    clearInvite(room, toCid) { return db.hdel('room:' + room, 'i:' + toCid); },

    // ----- Partidas -----
    saveMatch(id, match) { return db.set('match:' + id, JSON.stringify(match)); },
    async getMatch(id) {
      const v = await db.get('match:' + id);
      return v ? JSON.parse(v) : null;
    },
    // Solo manda mensajes al otro jugador (sin tocar mi buzón)
    send(id, toCid, msgs) {
      return db.push(`mbox:${id}:${toCid}`, msgs.map(m => JSON.stringify(m)));
    },
    // Manda mensajes al otro jugador y recoge los que me llegaron
    async sync(id, fromCid, toCid, msgs) {
      const raw = await db.sync(`mbox:${id}:${toCid}`, msgs.map(m => JSON.stringify(m)), `mbox:${id}:${fromCid}`);
      return (raw || []).map(m => { try { return JSON.parse(m); } catch { return null; } }).filter(Boolean);
    },
  };
}
