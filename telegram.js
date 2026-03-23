const https = require('https');

function sendTelegramNotification(reservation) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping notification');
    return Promise.resolve();
  }

  const text =
    `🍸 Nueva reserva — Monasterio\n\n` +
    `👤 ${reservation.name}\n` +
    `📧 ${reservation.email}\n` +
    `📞 ${reservation.phone || '—'}\n` +
    `📅 ${reservation.date} a las ${reservation.time}\n` +
    `👥 ${reservation.guests} persona(s)\n` +
    (reservation.notes ? `📝 ${reservation.notes}\n` : '');

  const body = JSON.stringify({ chat_id: chatId, text });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) resolve(JSON.parse(data));
          else reject(new Error(`Telegram API ${res.statusCode}: ${data}`));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { sendTelegramNotification };
