module.exports = function handler(req, res) {
  const width = 600;
  const height = 60;
  const frames = 60;
  const deadlineUTC = Date.UTC(2026, 4, 26, 7, 59, 59);
  const scale = 2;

  function pad(n) { return String(n).padStart(2, '0'); }

  const FONT = {
    '0':['111','101','101','101','111'],
    '1':['010','110','010','010','111'],
    '2':['111','001','111','100','111'],
    '3':['111','001','011','001','111'],
    '4':['101','101','111','001','001'],
    '5':['111','100','111','001','111'],
    '6':['111','100','111','101','111'],
    '7':['111','001','001','001','001'],
    '8':['111','101','111','101','111'],
    '9':['111','101','111','001','111'],
    'E':['111','100','110','100','111'],
    'N':['101','111','111','101','101'],
    'D':['110','101','101','101','110'],
    'S':['111','100','111','001','111'],
    'T':['111','010','010','010','010'],
    'O':['111','101','101','101','111'],
    'I':['111','010','010','010','111'],
    'G':['111','100','101','101','111'],
    'H':['101','101','111','101','101'],
    'R':['110','101','110','101','101'],
    'M':['101','111','101','101','101'],
    'C':['111','100','100','100','111'],
    '!':['010','010','010','000','010'],
    ' ':['000','000','000','000','000'],
    ':':['000','010','000','010','000'],
    '|':['010','010','010','010','010'],
  };

  function makePixels(text) {
    const pixels = new Uint8Array(width * height);
    let x = Math.floor((width - text.length * 6 * scale) / 2);
    const y = Math.floor((height - 7 * scale) / 2);
    for (const ch of text.toUpperCase()) {
      const glyph = FONT[ch] || FONT[' '];
      for (let row = 0; row < 7; row++) {
        const bits = glyph[row] || '000';
        for (let col = 0; col < 3; col++) {
          if (bits[col] === '1') {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                const px = x + col * scale + sx;
                const py = y + row * scale + sy;
                if (px >= 0 && px < width && py >= 0 && py < height)
                  pixels[py * width + px] = 1;
              }
            }
          }
        }
      }
      x += 6 * scale;
    }
    return pixels;
  }

  function lzwEncode(pixels) {
    const minCodeSize = 2;
    const clearCode = 1 << minCodeSize;
    const eofCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eofCode + 1;
    const maxCode = () => 1 << codeSize;
    const bytes = [];
    let bitBuf = 0, bitLen = 0;

    function emitCode(code) {
      bitBuf |= code << bitLen;
      bitLen += codeSize;
      while (bitLen >= 8) {
        bytes.push(bitBuf & 0xFF);
        bitBuf >>= 8;
        bitLen -= 8;
      }
    }

    const table = new Map();
    function tableKey(prefix, suf) { return prefix * 256 + suf; }

    function reset() {
      table.clear();
      codeSize = minCodeSize + 1;
      nextCode = eofCode + 1;
    }

    emitCode(clearCode);
    reset();

    let prefix = pixels[0];
    for (let i = 1; i < pixels.length; i++) {
      const suf = pixels[i];
      const key = tableKey(prefix, suf);
      if (table.has(key)) {
        prefix = table.get(key);
      } else {
        emitCode(prefix);
        if (nextCode < 4096) {
          table.set(key, nextCode++);
          if (nextCode > maxCode() && codeSize < 12) codeSize++;
        } else {
          emitCode(clearCode);
          reset();
        }
        prefix = suf;
      }
    }
    emitCode(prefix);
    emitCode(eofCode);
    if (bitLen > 0) bytes.push(bitBuf & 0xFF);

    const out = [minCodeSize];
    for (let i = 0; i < bytes.length; i += 255) {
      const chunk = bytes.slice(i, i + 255);
      out.push(chunk.length, ...chunk);
    }
    out.push(0);
    return Buffer.from(out);
  }

  const parts = [];

  parts.push(Buffer.from('GIF89a'));

  const lsd = Buffer.alloc(7);
  lsd.writeUInt16LE(width, 0);
  lsd.writeUInt16LE(height, 2);
  lsd[4] = 0xF1;
  lsd[5] = 0;
  lsd[6] = 0;
  parts.push(lsd);

  parts.push(Buffer.from([
    0xBD, 0x01, 0x07,
    0xFF, 0xFF, 0xFF,
    0x00, 0x00, 0x00,
    0x00, 0x00, 0x00,
  ]));

  parts.push(Buffer.from([
    0x21, 0xFF, 0x0B,
    ...Buffer.from('NETSCAPE2.0'),
    0x03, 0x01, 0x00, 0x00, 0x00
  ]));

  for (let i = 0; i < frames; i++) {
    const now = Date.now() + i * 1000;
    const diff = Math.max(0, deadlineUTC - now);
    const totalSec = Math.floor(diff / 1000);
    const sec = pad(totalSec % 60);
    const totalMin = Math.floor(totalSec / 60);
    const min = pad(totalMin % 60);
    const hrs = pad(Math.floor(totalMin / 60));
    const text = `ENDS TONIGHT! | ${hrs} HR : ${min} MIN : ${sec} SEC`;

    const gce = Buffer.alloc(8);
    gce[0] = 0x21; gce[1] = 0xF9; gce[2] = 0x04;
    gce[3] = 0x00;
    gce.writeUInt16LE(100, 4);
    gce[6] = 0x00; gce[7] = 0x00;
    parts.push(gce);

    const id = Buffer.alloc(10);
    id[0] = 0x2C;
    id.writeUInt16LE(0, 1); id.writeUInt16LE(0, 3);
    id.writeUInt16LE(width, 5); id.writeUInt16LE(height, 7);
    id[9] = 0x00;
    parts.push(id);

    parts.push(lzwEncode(makePixels(text)));
  }

  parts.push(Buffer.from([0x3B]));

  const gif = Buffer.concat(parts);

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.send(gif);
};
