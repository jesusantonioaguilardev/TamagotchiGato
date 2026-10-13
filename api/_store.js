// Almacén de gatos compartidos.
// En Vercel usa Upstash Redis; en local (sin variables de entorno) usa memoria.

const TTL = 60 * 60 * 24 * 60; // se borran tras 60 días sin actividad

// Escribe solo si la versión no cambió desde que la leímos (evita que
// dos acciones simultáneas se pisen).
const CAS = `
local v = redis.call('HGET', KEYS[1], 'v')
if (v or '') ~= ARGV[1] then return 0 end
redis.call('HSET', KEYS[1], 'data', ARGV[2], 'v', ARGV[3])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[4]))
return 1`;

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
    });
    return cached;
  }

  if (process.env.VERCEL) {
    throw new Error('Falta conectar Upstash Redis al proyecto (KV_REST_API_URL / KV_REST_API_TOKEN).');
  }

  // Solo para desarrollo local: se pierde al reiniciar
  const mem = globalThis.__petMem || (globalThis.__petMem = new Map());
  cached = makeStore({
    async read(key) { return mem.get(key) || null; },
    async cas(key, expected, data, v) {
      if ((mem.get(key)?.v || '') !== expected) return false;
      mem.set(key, { data, v });
      return true;
    },
  });
  return cached;
}

function makeStore({ read, cas }) {
  return {
    // Crea un gato nuevo; falla (false) si el id ya existe
    create(id, state) {
      return cas('pet:' + id, '', JSON.stringify(state), '1');
    },
    // Lee, modifica con fn y guarda. fn devuelve true si hay que guardar.
    async update(id, fn) {
      const key = 'pet:' + id;
      for (let i = 0; i < 6; i++) {
        const cur = await read(key);
        if (!cur) return null;
        const state = JSON.parse(cur.data);
        if (!fn(state)) return { state };
        if (await cas(key, cur.v, JSON.stringify(state), String(Number(cur.v) + 1))) return { state };
      }
      throw new Error('Demasiados cambios a la vez, intenta de nuevo.');
    },
  };
}
