// Servidor local para probar el multijugador sin Vercel:  npm run local
// Sirve los archivos estáticos y la API (con almacén en memoria si no hay
// variables de Upstash).

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pet from './api/pet.js';
import match from './api/match.js';

const API = { '/api/pet': pet, '/api/match': match };

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  const handler = API[url.pathname];
  if (handler) {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    req.query = Object.fromEntries(url.searchParams);
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
    return handler(req, res);
  }

  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT) || rel.startsWith('api')) { res.writeHead(404); return res.end(); }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('No encontrado');
  }
}).listen(PORT, () => console.log(`Tamagotchi en http://localhost:${PORT}`));
