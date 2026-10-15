// Minimal static server for local preview and tests. Supports Range requests so Safari can play the videos.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT ?? 4318);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
};
const allowed = new Set(['', 'assets', 'media', 'vendor']);

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  const relative = normalize(path === '/' ? '/index.html' : path).replace(/^\/+/, '');
  const top = relative.includes('/') ? relative.split('/')[0] : '';
  const file = join(root, relative);
  let stat;
  try {
    stat = statSync(file);
  } catch {
    stat = null;
  }
  if (!allowed.has(top) || relative.startsWith('..') || !stat?.isFile() || !types[extname(file)]) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  const headers = { 'content-type': types[extname(file)], 'accept-ranges': 'bytes' };
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${stat.size}`, 'content-length': end - start + 1 });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...headers, 'content-length': stat.size });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`));
