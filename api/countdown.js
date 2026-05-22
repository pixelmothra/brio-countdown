const PureImage = require('pureimage');
const GIFEncoder = require('gifencoder');
const { PassThrough } = require('stream');

module.exports = async function handler(req, res) {
  const width = 600;
  const height = 50;
  const frames = 60;
  const deadlineUTC = Date.UTC(2026, 4, 26, 7, 59, 59);

  const encoder = new GIFEncoder(width, height);
  const stream = new PassThrough();
  const chunks = [];
  stream.on('data', chunk => chunks.push(chunk));

  encoder.createReadStream().pipe(stream);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(1000);
  encoder.setQuality(10);

  const fnt = PureImage.registerFont(
    require.resolve('pureimage/src/fonts/Roboto-Regular.ttf'),
    'Roboto'
  );
  await fnt.load();

  for (let i = 0; i < frames; i++) {
    const now = Date.now() + i * 1000;
    const diff = Math.max(0, deadlineUTC - now);
    const totalSec = Math.floor(diff / 1000);
    const sec = String(totalSec % 60).padStart(2, '0');
    const totalMin = Math.floor(totalSec / 60);
    const min = String(totalMin % 60).padStart(2, '0');
    const hrs = String(Math.floor(totalMin / 60)).padStart(2, '0');

    const img = PureImage.make(width, height);
    const ctx = img.getContext('2d');

    ctx.fillStyle = '#BD0107';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Roboto';
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

  await new Promise(resolve => stream.on('end', resolve));
  const buffer = Buffer.concat(chunks);

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.send(buffer);
};
