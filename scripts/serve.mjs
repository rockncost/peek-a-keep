import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const port = Number(process.env.PORT || 4173);
const host = '127.0.0.1';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.md': 'text/plain; charset=utf-8',
};

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be a whole number from 1 to 65535.');
  process.exit(1);
}

function respond(response, status, message, method) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(method === 'HEAD' ? undefined : message);
}

const server = createServer(async (request, response) => {
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    respond(response, 405, 'Method not allowed', method);
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    respond(response, 400, 'Invalid path', method);
    return;
  }
  const parts = pathname.split('/').filter(Boolean);
  if (pathname.includes('\\') || pathname.includes('\0') || parts.some(part => part.startsWith('.') || part.includes(':'))) {
    respond(response, 403, 'Forbidden', method);
    return;
  }

  try {
    const file = await realpath(resolve(root, ...parts, ...(pathname.endsWith('/') ? ['index.html'] : [])));
    const fromRoot = relative(root, file);
    if (isAbsolute(fromRoot) || fromRoot === '..' || fromRoot.startsWith(`..${sep}`)) {
      respond(response, 403, 'Forbidden', method);
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      respond(response, 404, 'Not found', method);
      return;
    }
    const content = method === 'HEAD' ? undefined : await readFile(file);
    response.writeHead(200, {
      'Content-Type': mime[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(content);
  } catch (error) {
    const status = ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code) ? 404 : 500;
    respond(response, status, status === 404 ? 'Not found' : 'Unable to read file', method);
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Set PORT to choose another port.`
    : `Unable to start server: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`\n  PEEK-A-KEEP\n  Play: http://localhost:${port}\n  Press Ctrl+C to stop.\n`);
});
