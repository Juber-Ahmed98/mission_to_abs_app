// Generate solid-black PNG icons with a small accent dot.
// No image dependencies — builds a PNG from scratch using zlib + CRC32.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '..', 'public');

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

const BG = [0x00, 0x00, 0x00, 0xff];
const ACCENT = [0x5e, 0x9e, 0xd6, 0xff];

// CRC table per PNG spec.
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePNG(size, draw) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const rgba = draw(x, y, size);
      const o = (y * size + x) * 4;
      pixels[o] = rgba[0];
      pixels[o + 1] = rgba[1];
      pixels[o + 2] = rgba[2];
      pixels[o + 3] = rgba[3];
    }
  }
  // Filter byte 0 per row.
  const filtered = Buffer.alloc(size * size * 4 + size);
  for (let y = 0; y < size; y++) {
    filtered[y * (size * 4 + 1)] = 0;
    pixels.copy(filtered, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(filtered, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function regularDraw(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.125;
  const dx = x - cx;
  const dy = y - cy;
  if (dx * dx + dy * dy <= r * r) return ACCENT;
  return BG;
}

function maskableDraw(x, y, size) {
  // Keep the dot fully inside the maskable safe zone (~80% inner).
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.09;
  const dx = x - cx;
  const dy = y - cy;
  if (dx * dx + dy * dy <= r * r) return ACCENT;
  return BG;
}

function writeIcon(name, size, draw) {
  const out = resolve(PUBLIC_DIR, name);
  writeFileSync(out, makePNG(size, draw));
  console.log(`wrote ${out} (${size}x${size})`);
}

writeIcon('icon-192.png', 192, regularDraw);
writeIcon('icon-512.png', 512, regularDraw);
writeIcon('icon-maskable.png', 512, maskableDraw);
