const omggif = require('omggif');

module.exports = function handler(req, res) {
  const width = 600;
  const height = 50;
  const frames = 60;
  const deadlineUTC = Date.UTC(2026, 4, 26, 7, 59, 59);

  // GIF palette must be exactly 256 colors (power of 2)
  const palette = new Array(256 * 3).fill(0);
  // index 0 = background #BD0107
  palette[0] = 0xBD; palette[1] = 0x01; palette[2] = 0x07;
  // index 1 = white #FFFFFF
  palette[3] = 0xFF; palette[4] = 0xFF; palette[5] = 0xFF;

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

  function drawText(pixels, text, startX, startY) {
    let x = startX;
    for (const ch of text.toUpperCase()) {
      const glyph = FONT[ch] || FONT[' '];
      for (let row = 0; row < glyph.length; row++) {
        for (let col = 0; col < glyph[row].length; col++) {
          if (glyph[row][col] === '1') {
            const px = x + col;
            const py = startY + row;
            if (px >= 0 && px < width && py >= 0 && py < height) {
              pixels[py * width + px] = 1;
            }
          }
        }
      }
      x += 6;
    }
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  const buf = Buffer.alloc(width * height * frames * 4 + 1024);
  const gif = new omggif.GifWriter(buf, width, height, { 
    palette: palette, 
    loop: 0 
  });

  for (let i = 0; i < frames; i++) {
    const now = Date.now() + i * 1000;
    const diff = Math.max(0, deadlineUTC - now);
    const totalSec = Math.floor(diff / 1000);
    const sec = pad(totalSec % 60);
    const totalMin = Math.floor(totalSec / 60);
    const min = pad(totalMin % 60);
    const hrs = pad(Math.floor(totalMin / 60));

    const pixels = new Uint8Array(width * height).fill(0);
    const text = `ENDS TONIGHT! | ${hrs} HR : ${min} MIN : ${sec} SEC`;
    const textWidth = text.length * 6;
    const startX = Math.floor((width - textWidth) / 2);
    const startY = Math.floor((height - 7) / 2);
    drawText(pixels, text, startX, startY);

    gif.addFrame(0, 0, width, height, pixels, { 
      delay: 100,
      palette: palette
    });
  }

  const data = buf.slice(0, gif.end());

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.send(data);
};
