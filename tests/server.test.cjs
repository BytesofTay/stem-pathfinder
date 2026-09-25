const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

async function launch(dbPath) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: root,
    env: { ...process.env, PORT: '0', STEM_PATH_DB: dbPath },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const base = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error('Server did not start')), 5000);
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { clearTimeout(timeout); resolve(match[0]); }
    });
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited: ${code}`)); });
  });
  return { child, base };
}

async function stop(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await once(child, 'exit');
}

test('saved schools persist across restart and stay isolated by browser cookie', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stem-pathfinder-'));
  const dbPath = path.join(temp, 'favorites.sqlite');
  let server;
  try {
    server = await launch(dbPath);
    const first = await fetch(`${server.base}/api/favorites`);
    assert.equal(first.status, 200);
    const cookie = first.headers.get('set-cookie').split(';')[0];

    const save = await fetch(`${server.base}/api/favorites`, {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ favorites: ['Sample School'] }),
    });
    assert.equal(save.status, 200);
    const own = await fetch(`${server.base}/api/favorites`, { headers: { cookie } });
    assert.deepEqual((await own.json()).favorites, ['Sample School']);

    const other = await fetch(`${server.base}/api/favorites`);
    assert.deepEqual((await other.json()).favorites, []);
    const invalid = await fetch(`${server.base}/api/favorites`, {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ favorites: [123] }),
    });
    assert.equal(invalid.status, 400);

    await stop(server.child);
    server = await launch(dbPath);
    const restored = await fetch(`${server.base}/api/favorites`, { headers: { cookie } });
    assert.deepEqual((await restored.json()).favorites, ['Sample School']);
  } finally {
    if (server) await stop(server.child);
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
