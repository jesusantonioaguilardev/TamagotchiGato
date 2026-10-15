// ===== Tetris 1 vs 1 en vivo =====
// Conexión entre los dos navegadores:
//   1) Intenta conexión directa (WebRTC DataChannel): casi sin retraso y sin
//      gastar servidor. Para "presentarse" usa el buzón de /api/match.
//   2) Si en unos segundos no conecta (redes muy cerradas), sigue mandando
//      la partida por el buzón del servidor.

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
const P2P_TIMEOUT = 8000;
const POLL = { connecting: 400, relay: 250, p2p: 3000 };

async function post(body) {
  const r = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.message || data.error || r.status); e.status = r.status; throw e; }
  return data;
}

export function invite(room, cid, who, to) {
  return post({ op: 'invite', room, cid, who, to }).then(r => r.match);
}

export function answer(match, cid, who, accept) {
  return post({ op: 'answer', match, cid, who, accept });
}

// Canal de mensajes con el rival (directo o por el servidor)
function createLink({ match, cid, host, onMessage, onMode }) {
  let mode = 'connecting';
  let outbox = [];
  let closed = false;
  let pollTimer, p2pTimer;
  let pc = null, dc = null;
  const pendingIce = [];
  const forceRelay = new URLSearchParams(location.search).has('relay');

  const setMode = m => { if (mode !== m) { console.info('[1vs1] conexión:', m); mode = m; onMode(m); } };

  async function sync() {
    if (closed) return;
    const msgs = outbox; outbox = [];
    try {
      const r = await post({ op: 'sync', match, cid, msgs });
      r.msgs.forEach(handle);
    } catch (e) {
      if (e.status === 404 || e.status === 403) { onMessage({ t: 'bye' }); return; }
      outbox = msgs.concat(outbox);
    }
    if (!closed) pollTimer = setTimeout(sync, POLL[mode]);
  }

  function armP2PTimeout() {
    if (p2pTimer || mode !== 'connecting') return;
    p2pTimer = setTimeout(() => { if (mode === 'connecting') setMode('relay'); }, P2P_TIMEOUT);
  }

  async function handle(m) {
    armP2PTimeout();
    if (m.t === 'sig') return onSignal(m.d).catch(err => console.warn('[1vs1] señal:', err));
    if (m.t === 'ice') {
      if (pc && pc.remoteDescription) pc.addIceCandidate(m.c).catch(() => {});
      else pendingIce.push(m.c);
      return;
    }
    onMessage(m);
  }

  async function onSignal(d) {
    if (!pc) return;
    await pc.setRemoteDescription(d);
    while (pendingIce.length) await pc.addIceCandidate(pendingIce.shift()).catch(() => {});
    if (d.type === 'offer') {
      await pc.setLocalDescription(await pc.createAnswer());
      outbox.push({ t: 'sig', d: pc.localDescription.toJSON() });
    }
  }

  function setupChannel(ch) {
    dc = ch;
    dc.onopen = () => setMode('p2p');
    dc.onmessage = e => { try { onMessage(JSON.parse(e.data)); } catch (err) {} };
    dc.onclose = () => { if (!closed && mode === 'p2p') setMode('relay'); };
  }

  if (!forceRelay && typeof RTCPeerConnection === 'function') {
    try {
      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pc.onicecandidate = e => { if (e.candidate) outbox.push({ t: 'ice', c: e.candidate.toJSON() }); };
      pc.onconnectionstatechange = () => console.info('[1vs1] WebRTC:', pc.connectionState);
      if (host) {
        setupChannel(pc.createDataChannel('tetris', { ordered: true }));
        pc.createOffer()
          .then(o => pc.setLocalDescription(o))
          .then(() => outbox.push({ t: 'sig', d: pc.localDescription.toJSON() }))
          .catch(() => setMode('relay'));
      } else {
        pc.ondatachannel = e => setupChannel(e.channel);
      }
    } catch (e) {
      setMode('relay');
    }
  } else {
    setMode('relay');
  }

  sync();

  return {
    send(m) {
      if (closed) return;
      if (dc && dc.readyState === 'open') dc.send(JSON.stringify(m));
      else outbox.push(m);
    },
    get mode() { return mode; },
    // Manda lo pendiente, avisa al servidor y corta
    async close() {
      if (closed) return;
      closed = true;
      clearTimeout(pollTimer); clearTimeout(p2pTimer);
      const msgs = outbox; outbox = [];
      try {
        if (dc && dc.readyState === 'open') msgs.forEach(m => dc.send(JSON.stringify(m)));
        else if (msgs.length) await post({ op: 'sync', match, cid, msgs });
      } catch (e) {}
      setTimeout(() => { try { dc && dc.close(); pc && pc.close(); } catch (e) {} }, 500);
      post({ op: 'cancel', match, cid }).catch(() => {});
    },
  };
}

const MODE_TEXT = { connecting: 'Conectando...', p2p: 'Conexión directa', relay: 'Por servidor' };

// Arranca una partida. host = quien retó (manda la semilla de las piezas).
// hooks: { onAccepted(), onDeclined(), onFinish(result) }
export function playVersus({ match, cid, who, host, rival, hooks }) {
  let ctrl = null;        // control del Tetris (cuando ya está abierto)
  let started = false;
  let seed = 0;
  let lastSeen = Date.now();
  let finished = false;

  const link = createLink({
    match, cid, host,
    onMode: m => ctrl && ctrl.status(MODE_TEXT[m]),
    onMessage,
  });

  function openGame() {
    ctrl = Tetris.openVersus({
      rival,
      onEvent: m => link.send(m),
      onDone: res => {
        finished = true;
        clearInterval(heartbeat);
        link.close();
        hooks.onFinish(res);
      },
    });
    ctrl.status(MODE_TEXT[link.mode]);
  }

  function onMessage(m) {
    lastSeen = Date.now();
    switch (m.t) {
      case 'accepted':                     // (host) el rival aceptó
        hooks.onAccepted();
        openGame();
        seed = (Math.random() * 2 ** 32) >>> 0;
        link.send({ t: 'start', seed });
        break;
      case 'declined':
        hooks.onDeclined(m.who || rival);
        link.close();
        break;
      case 'start':                        // (invitado) llega la semilla
        if (started) break;
        started = true;
        seed = m.seed;
        ctrl && ctrl.start(seed);
        link.send({ t: 'go' });
        break;
      case 'go':                           // (host) el rival ya empezó
        if (started) break;
        started = true;
        ctrl && ctrl.start(seed);
        break;
      case 'board': ctrl && ctrl.opponent(m.b, m.s, m.l); break;
      case 'atk': ctrl && ctrl.garbage(m.n); break;
      case 'over': ctrl && ctrl.opponentOver(); break;
      case 'quit': ctrl && ctrl.opponentLeft(`${rival} se rindió`); break;
      case 'bye':
        if (ctrl) ctrl.opponentLeft(`${rival} se fue`);
        else if (!finished) { hooks.onDeclined(rival); link.close(); }
        break;
    }
  }

  // Latido para detectar si el rival se desconectó
  const heartbeat = setInterval(() => {
    if (!ctrl) return;
    link.send({ t: 'ping' });
    if (started && Date.now() - lastSeen > 15000) ctrl.opponentLeft(`${rival} se desconectó`);
  }, 2000);

  if (!host) openGame();

  return {
    // (host) cancelar mientras espera respuesta
    cancel() { clearInterval(heartbeat); link.close(); },
  };
}
