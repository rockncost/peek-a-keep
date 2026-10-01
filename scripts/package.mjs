import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A dependency-free ZIP writer using the universally supported STORE method.
// Fixed timestamps and sorted paths produce identical archives from identical files.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = join(root, 'dist', 'peek-a-keep-itch.zip');
const paths = ['index.html', 'styles.css', 'README.md', 'EXPANSION_PLAN.md'];

async function collect(folder) {
  const entries = await readdir(join(root, folder), { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const path = `${folder}/${entry.name}`;
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile()) paths.push(path);
    else throw new Error(`Cannot package non-regular file: ${path}`);
  }
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let value = n;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  crcTable[n] = value >>> 0;
}
function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

try {
  await collect('src');
  await collect('vendor');
  await collect('assets');
  paths.sort();
  if (paths.length > 1000) throw new Error('The archive exceeds itch.io’s 1,000-file limit.');

  const localParts = [];
  const centralParts = [];
  let offset = 0;
  let extractedSize = 0;
  for (const path of paths) {
    const name = Buffer.from(path, 'utf8');
    const data = await readFile(join(root, path));
    if (name.length > 240) throw new Error(`Path is too long for itch.io: ${path}`);
    if (data.length > 200 * 1024 * 1024) throw new Error(`File exceeds itch.io’s 200 MB limit: ${path}`);
    extractedSize += data.length;
    if (extractedSize > 500 * 1024 * 1024) throw new Error('Extracted files exceed itch.io’s 500 MB limit.');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // Minimum ZIP 2.0.
    local.writeUInt16LE(0x0800, 6); // UTF-8 paths.
    local.writeUInt16LE(0x0021, 12); // 1980-01-01, 00:00:00.
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4); // Unix, ZIP 2.0.
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0x0021, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(0x81a40000, 38); // Regular file, permissions 0644.
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(paths.length, 8);
  end.writeUInt16LE(paths.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  const archive = Buffer.concat([...localParts, centralDirectory, end]);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, archive);
  console.log(`\n  Packaged ${paths.length} files (${(archive.length / 1024 / 1024).toFixed(2)} MB).\n  ${destination}\n  index.html is at the archive root, ready for itch.io.\n`);
} catch (error) {
  console.error(`Packaging failed: ${error.message}`);
  process.exitCode = 1;
}
