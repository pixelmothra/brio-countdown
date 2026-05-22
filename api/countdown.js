const { createCanvas } = require('canvas');
const GIFEncoder = require('gif-encoder-2');

module.exports = async function handler(req, res) {
  const width = 600;
  const height = 50;
  const frames = 60;

  const deadlineUTC = Date.UTC(2026, 4, 26, 7, 59, 59);

  const encoder = new GIFEncoder(width, height, 'neuquant', true);
  encoder.setDelay(1000);
  encoder.setRepeat(0);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < frames; i++) {
    const now = Date.now() + i * 1000;
    const diff = Math.max(0, deadlineUTC - now);
    const totalSec = Math.floor(diff / 1000);
    const sec = String(totalSec % 60).padStart(2, '0');
    const totalMin = Math.floor(totalSec / 60);
    const min = String(totalMin % 60).padStart(2, '0');
    const hrs = String(Math.floor(totalMin / 60)).padStart(2, '0');

    // Background
    ctx.fillStyle = '#BD0107';
    ctx.fillRect(0, 0, width, height);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `ENDS TONIGHT!  |  ${hrs} HR  :  ${min} MIN  :  ${sec} SEC`,
      width / 2,
      height / 2
    );

    encoder.addFrame(ctx);
  }

  encoder.finish();

  const buffer = encoder.out.getData();

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.send(buffer);
};
