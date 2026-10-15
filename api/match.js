// Partidas 1 vs 1 de Tetris entre dos personas de la misma mascota
//   POST /api/match { op: 'invite', room, cid, who, to }  -> { match }
//   POST /api/match { op: 'answer', room, match, cid, accept } -> { ok }
//   POST /api/match { op: 'cancel', room, match, cid }     -> { ok }
//   POST /api/match { op: 'sync', match, cid, msgs }       -> { msgs }
//
// 'sync' es el canal de mensajes: sirve para conectar los navegadores
// directamente (WebRTC) y, si eso falla, para mandar la partida por aquí.

import { getStore } from './_store.js';

const ROOM_RE = /^[a-z0-9]{6}$/;
const MATCH_RE = /^[a-z0-9]{10}$/;
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function newId(n) {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method' });
  }
  try {
    const store = await getStore();
    const body = readBody(req);
    const cid = cleanCid(body.cid);
    if (!cid) return res.status(400).json({ error: 'bad_cid' });

    if (body.op === 'invite') {
      const room = String(body.room || '').toLowerCase();
      const to = cleanCid(body.to);
      if (!ROOM_RE.test(room) || !to || to === cid) return res.status(400).json({ error: 'bad_request' });
      const id = newId(10);
      const match = { room, a: cid, b: to, aWho: cleanWho(body.who), state: 'pending', t: Date.now() };
      await store.saveMatch(id, match);
      await store.setInvite(room, to, { match: id, from: cid, who: match.aWho, t: match.t });
      return res.status(201).json({ match: id });
    }

    const id = String(body.match || '');
    if (!MATCH_RE.test(id)) return res.status(400).json({ error: 'bad_match' });
    const match = await store.getMatch(id);
    if (!match) return res.status(404).json({ error: 'not_found' });
    if (cid !== match.a && cid !== match.b) return res.status(403).json({ error: 'not_player' });
    const other = cid === match.a ? match.b : match.a;

    if (body.op === 'answer') {
      if (cid !== match.b) return res.status(403).json({ error: 'not_invited' });
      await store.clearInvite(match.room, match.b);
      match.state = body.accept ? 'accepted' : 'declined';
      await store.saveMatch(id, match);
      await store.send(id, other, [{ t: body.accept ? 'accepted' : 'declined', who: cleanWho(body.who) }]);
      return res.status(200).json({ ok: true });
    }

    if (body.op === 'cancel') {
      if (match.state === 'pending') await store.clearInvite(match.room, match.b);
      match.state = 'closed';
      await store.saveMatch(id, match);
      await store.send(id, other, [{ t: 'bye' }]);
      return res.status(200).json({ ok: true });
    }

    if (body.op === 'sync') {
      const msgs = Array.isArray(body.msgs) ? body.msgs.slice(0, 50) : [];
      if (JSON.stringify(msgs).length > 60000) return res.status(413).json({ error: 'too_big' });
      const inbox = await store.sync(id, cid, other, msgs);
      return res.status(200).json({ msgs: inbox, state: match.state });
    }

    return res.status(400).json({ error: 'bad_op' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server', message: err.message });
  }
}
