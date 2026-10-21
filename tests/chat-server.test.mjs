import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const question = () => ({ messages: [{ role: 'user', content: 'Show medical programs for grade 9.' }], language: 'en', comparisonSchoolIds: [] });
async function assertFailure(response, status, code) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('content-type'), /application\/json/u);
  const body = await response.json();
  assert.equal(body.error.code, code);
}

test('local Node route preserves shared handler JSON validation and disabled-mode responses', async t => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stem-chat-route-'));
  const serverPath = fileURLToPath(new URL('../server.js', import.meta.url));
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: '0', CHAT_ENABLED: 'false', OPENAI_API_KEY: '', STEM_PATH_DB: path.join(temporaryRoot, 'test.sqlite') },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      await exited;
    }
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  });
  const base = await new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';
    const timeout = setTimeout(() => reject(new Error(`Local server startup timed out: ${errorOutput}`)), 5000);
    child.stderr.on('data', chunk => { errorOutput += chunk; });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/u);
      if (match) { clearTimeout(timeout); resolve(match[0]); }
    });
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Local server exited ${code}: ${errorOutput}`)); });
  });
  const endpoint = `${base}/api/chat`;
  await assertFailure(await fetch(endpoint), 405, 'BAD_REQUEST');
  await assertFailure(await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify(question()) }), 503, 'NOT_CONFIGURED');
  await assertFailure(await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: '{invalid' }), 400, 'BAD_REQUEST');
  await assertFailure(await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://other.test' }, body: JSON.stringify(question()) }), 403, 'BAD_REQUEST');
});
