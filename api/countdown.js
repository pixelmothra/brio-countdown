export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const deadlineUTC = Date.UTC(2026, 4, 26, 7, 59, 59);
  const now = Date.now();
  const diff = Math.max(0, deadlineUTC - now);

  const totalSec = Math.floor(diff / 1000);
  const sec = String(totalSec % 60).padStart(2, '0');
  const totalMin = Math.floor(totalSec / 60);
  const min = String(totalMin % 60).padStart(2, '0');
  const hrs = String(Math.floor(totalMin / 60)).padStart(2, '0');

  const { ImageResponse } = await import('@vercel/og');

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          backgroundColor: '#BD0107',
          width: '600px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          letterSpacing: '2px',
        },
        children: `ENDS TONIGHT!  |  ${hrs} HR  :  ${min} MIN  :  ${sec} SEC`,
      },
    },
    { width: 600, height: 50 }
  );
}
