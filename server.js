const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');

const root = __dirname;
const webRoot = path.join(root, 'lausd_magnet_app', 'web');
const dbPath = process.env.STEM_PATH_DB || path.join(root, 'data', 'stem-pathfinder.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS saved_schools (
  visitor_id TEXT NOT NULL,
  school_name TEXT NOT NULL,
  saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (visitor_id, school_name)
)`);

const listSaved = db.prepare('SELECT school_name FROM saved_schools WHERE visitor_id = ? ORDER BY saved_at, school_name');
const insertSaved = db.prepare('INSERT OR IGNORE INTO saved_schools (visitor_id, school_name) VALUES (?, ?)');
const replaceSaved = db.transaction((visitorId, names) => {
  db.prepare('DELETE FROM saved_schools WHERE visitor_id = ?').run(visitorId);
  for (const name of names) insertSaved.run(visitorId, name);
});

function visitorId(req, res) {
  const existing = req.headers.cookie?.match(/(?:^|;\s*)stem_visitor=([a-f0-9]{32})(?:;|$)/)?.[1];
  if (existing) return existing;
  const id = crypto.randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie', `stem_visitor=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
  return id;
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 16_384) reject(new Error('Request too large'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true });
  if (url.pathname === '/api/favorites') {
    const id = visitorId(req, res);
    if (req.method === 'GET') return send(res, 200, { favorites: listSaved.all(id).map(row => row.school_name) });
    if (req.method === 'PUT') {
      try {
        const body = await readJson(req);
        if (!Array.isArray(body.favorites) || body.favorites.length > 180 || body.favorites.some(n => typeof n !== 'string' || n.length > 200)) {
          return send(res, 400, { error: 'favorites must be an array of up to 180 school names' });
        }
        replaceSaved(id, [...new Set(body.favorites)]);
        return send(res, 200, { favorites: listSaved.all(id).map(row => row.school_name) });
      } catch (error) { return send(res, 400, { error: error.message }); }
    }
    return send(res, 405, { error: 'Method not allowed' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
  const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const file = path.resolve(webRoot, `.${relative}`);
  if (!file.startsWith(`${webRoot}${path.sep}`)) return send(res, 403, { error: 'Forbidden' });
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
server.listen(port, host, () => console.log(`STEM Pathfinder running at http://${host}:${server.address().port}`));
