// API del gato compartido
//   GET  /api/pet?id=abc123                          -> { state }
//   POST /api/pet { op: 'create', state?, who, cid }  -> { id, state }
//   POST /api/pet { op: 'act', id, action, payload, who, cid } -> { state, result }

import { getStore } from './_store.js';
import { newPet, catchUp, applyAction, addLog, sanitize } from '../logic.js';

const ID_RE = /^[a-z0-9]{6}$/;
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // sin i, l, o, 0, 1
const ACTIONS = ['feed', 'tetris', 'sleep', 'clean', 'medicine', 'pet', 'rename', 'skin', 'reset'];

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map(b => ALPHABET[b % ALPHABET.length]).join('');
}

const cleanWho = w => String(w || '').trim().slice(0, 16) || 'Alguien';
const cleanCid = c => String(c || '').slice(0, 24);

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const store = await getStore();

    if (req.method === 'GET') {
      const id = String(req.query.id || '').toLowerCase();
      if (!ID_RE.test(id)) return res.status(400).json({ error: 'bad_id' });
      const out = await store.update(id, s => catchUp(s));
      if (!out) return res.status(404).json({ error: 'not_found' });
      return res.status(200).json({ state: out.state });
    }

    if (req.method === 'POST') {
      const body = readBody(req);
      const who = cleanWho(body.who);
      const cid = cleanCid(body.cid);

      if (body.op === 'create') {
        const now = Date.now();
        const state = body.state ? sanitize(body.state, now) : newPet();
        catchUp(state, now);
        addLog(state, who, cid, 'share', now);
        for (let i = 0; i < 5; i++) {
          const id = newId();
          if (await store.create(id, state)) return res.status(201).json({ id, state });
        }
        return res.status(500).json({ error: 'id_collision' });
      }

      if (body.op === 'act') {
        const id = String(body.id || '').toLowerCase();
        if (!ID_RE.test(id)) return res.status(400).json({ error: 'bad_id' });
        if (!ACTIONS.includes(body.action)) return res.status(400).json({ error: 'bad_action' });
        let result;
        const out = await store.update(id, s => {
          const now = Date.now();
          catchUp(s, now);
          result = applyAction(s, body.action, body.payload || {}, now);
          if (result.ok) addLog(s, who, cid, body.action, now, result.log);
          return true;
        });
        if (!out) return res.status(404).json({ error: 'not_found' });
        return res.status(200).json({ state: out.state, result });
      }

      return res.status(400).json({ error: 'bad_op' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server', message: err.message });
  }
}
