const omggif = require('omggif');

module.exports = function handler(req, res) {
  const width = 600;
  const height = 50;
  const frames = 60;
  const deadlineUTC = Date.UTC(2026, 4, 26, 7, 59, 59);

  // Color palette
  const BG_R = 0xBD, BG_G = 0x01, BG_B = 0x07; // #BD0107
  const FG_R = 0xFF, FG_G = 0xFF, FG_B = 0xFF; // white

  const palette = [
    BG_R, BG_G, BG_B, // index 0 = background
    FG_R, FG_G, FG_B, // index 1 = white text
  ];

  // Pad palette to 256 colors (required by GIF spec)
  while (palette.length < 256 * 3) palette.push(0);

  const buf = Buffer.alloc(width * height * frames * 10 + 1024);
  const gif = new omggif.GifWriter(buf, width, height, { palette, loop: 0 });

  // Simple 5x7 pixel font bitmap for digits and letters
  const FONT = {
    '0': ['111','101','101','101','111'],
    '1': ['010','110','010','010','111'],
    '2': ['111','001','111','100','111'],
    '3': ['111','001','011','001','111'],
    '4': ['101','101','111','001','001'],
    '5': ['111','100','111','001','111'],
    '6': ['111','100','111','101','111'],
    '7': ['111','001','001','001','001'],
    '8': ['111','101','111','101','111'],
    '9': ['111','101','111','001','111'],
    'E': ['111','100','110','100','111'],
    'N': ['101','111','111','101','101'],
    'D': ['110','101','101','101','110'],
    'S': ['111','100','111','001','111'],
    'T': ['111','010','010','010','010'],
    'O': ['111','101','101','101','111'],
    'I': ['111','010','010','010','111'],
    'G': ['111','100','101','101','111'],
    'H': ['101','101','111','101','101'],
    'R': ['110','101','110','101','101'],
    'M': ['101','111','101','101','101'],
    'C': ['111','100','100','100','111'],
    '!': ['010','010','010','000','010'],
    ' ': ['000','000','000','000','000'],
    ':': ['000','010','000','010','000'],
    '|': ['010','010','010','010','010'],
  };

  function drawText(pixels, text, startX, startY, color) {
    let x = startX;
    for (const ch of text.toUpperCase()) {
      const glyph = FONT[ch] || FONT[' '];
      for (let row = 0; row < glyph.length; row++) {
        for (let col = 0; col < glyph[row].length; col++) {
          if (glyph[row][col] === '1') {
            const px = x + col;
            const py = startY + row;
            if (px >= 0 && px < width && py >= 0 && py < height) {
              pixels[py * width + px] = color;
            }
          }
        }
      }
      x += 5; // char width + 1px spacing
    }
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  for (let i = 0; i < frames; i++) {
    const now = Date.now() + i * 1000;
    const diff = Math.max(0, deadlineUTC - now);
    const totalSec = Math.floor(diff / 1000);
    const sec = pad(totalSec % 60);
    const totalMin = Math.floor(totalSec / 60);
    const min = pad(totalMin % 60);
    const hrs = pad(Math.floor(totalMin / 60));

    const pixels = new Uint8Array(width * height).fill(0); // fill with bg color index

    const text = `ENDS TONIGHT! | ${hrs} HR : ${min} MIN : ${sec} SEC`;
    // Center text: each char is 5px wide, space between chars already in drawText
    const textWidth = text.length * 5;
    const startX = Math.floor((width - textWidth) / 2);
    const startY = Math.floor((height - 7) / 2);

    drawText(pixels, text, startX, startY, 1);

    gif.addFrame(0, 0, width, height, pixels, { delay: 100, palette });
  }

  const data = buf.slice(0, gif.end());

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.send(data);
};
