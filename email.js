const nodemailer = require('nodemailer');

const FROM  = process.env.FROM_EMAIL  || 'reservas@monasterio.es';
const BCC   = process.env.BCC_EMAIL   || 'denny@kolor-berlin.com';

// Create transporter lazily so env vars are read at send-time
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail',
    port: parseInt(process.env.SMTP_PORT || '25', 10),
    secure: false,
    // No auth for internal Docker mail relay
    ...(process.env.SMTP_USER ? {
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    } : {}),
    tls: { rejectUnauthorized: false },
  });
}

const translations = {
  es: {
    subject: 'Confirmación de reserva — Monasterio',
    greeting: (name) => `Estimado/a ${name},`,
    body: 'Su reserva en Monasterio ha sido <strong>confirmada</strong>. Le esperamos con mucha ilusión.',
    details: 'Detalles de su reserva',
    date: 'Fecha', time: 'Hora', guests: 'Personas', notes: 'Notas',
    address: 'Paseo Marítimo 12, Palma de Mallorca',
    footer: 'Esperamos verle pronto. ¡Hasta entonces!',
    team: 'El equipo de Monasterio',
  },
  en: {
    subject: 'Reservation Confirmation — Monasterio',
    greeting: (name) => `Dear ${name},`,
    body: 'Your reservation at Monasterio has been <strong>confirmed</strong>. We look forward to welcoming you.',
    details: 'Your reservation details',
    date: 'Date', time: 'Time', guests: 'Guests', notes: 'Notes',
    address: 'Paseo Marítimo 12, Palma de Mallorca',
    footer: 'We look forward to welcoming you soon.',
    team: 'The Monasterio Team',
  },
  de: {
    subject: 'Reservierungsbestätigung — Monasterio',
    greeting: (name) => `Sehr geehrte/r ${name},`,
    body: 'Ihre Reservierung im Monasterio ist <strong>bestätigt</strong>. Wir freuen uns sehr auf Ihren Besuch.',
    details: 'Ihre Reservierungsdetails',
    date: 'Datum', time: 'Uhrzeit', guests: 'Personen', notes: 'Anmerkungen',
    address: 'Paseo Marítimo 12, Palma de Mallorca',
    footer: 'Wir freuen uns darauf, Sie bald begrüßen zu dürfen.',
    team: 'Das Monasterio-Team',
  },
  fr: {
    subject: 'Confirmation de réservation — Monasterio',
    greeting: (name) => `Cher/Chère ${name},`,
    body: 'Votre réservation au Monasterio est <strong>confirmée</strong>. Nous nous réjouissons de vous accueillir.',
    details: 'Détails de votre réservation',
    date: 'Date', time: 'Heure', guests: 'Personnes', notes: 'Notes',
    address: 'Paseo Marítimo 12, Palma de Majorque',
    footer: 'Nous nous réjouissons de vous accueillir bientôt.',
    team: "L'équipe Monasterio",
  },
};

function buildHtml(t, reservation) {
  const notesRow = reservation.notes
    ? `<tr><td style="padding:6px 0;color:#c9a84c;font-weight:600">${t.notes}:</td><td style="padding:6px 0 6px 16px">${reservation.notes}</td></tr>`
    : '';
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0a07;font-family:'Georgia',serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0a07;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#13100c;border:1px solid rgba(201,168,76,0.2)">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1208 0%,#0d0a07 100%);padding:48px 40px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.3)">
            <div style="font-size:11px;letter-spacing:6px;color:#c9a84c;text-transform:uppercase;margin-bottom:12px">Palma de Mallorca</div>
            <div style="font-size:36px;letter-spacing:8px;color:#f5efe6;font-family:'Georgia',serif;text-transform:uppercase">MONASTERIO</div>
            <div style="width:60px;height:1px;background:#c9a84c;margin:20px auto 0"></div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 20px;color:#f5efe6">
            <p style="margin:0 0 20px;font-size:16px;color:#c9a84c">${t.greeting(reservation.name)}</p>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#c8bfb0">${t.body}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0a07;border:1px solid rgba(201,168,76,0.2);padding:24px;margin-bottom:32px">
              <tr><td colspan="2" style="padding-bottom:16px;font-size:11px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase">${t.details}</td></tr>
              <tr><td style="padding:6px 0;color:#c9a84c;font-weight:600">${t.date}:</td><td style="padding:6px 0 6px 16px;color:#f5efe6">${reservation.date}</td></tr>
              <tr><td style="padding:6px 0;color:#c9a84c;font-weight:600">${t.time}:</td><td style="padding:6px 0 6px 16px;color:#f5efe6">${reservation.time}</td></tr>
              <tr><td style="padding:6px 0;color:#c9a84c;font-weight:600">${t.guests}:</td><td style="padding:6px 0 6px 16px;color:#f5efe6">${reservation.guests}</td></tr>
              ${notesRow}
            </table>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#c8bfb0">${t.footer}</p>
            <p style="margin:0;font-size:14px;color:#c9a84c">${t.team}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(201,168,76,0.1);text-align:center">
            <div style="font-size:12px;color:#5a4e3d;letter-spacing:2px">${t.address}</div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendReservationEmail(reservation) {
  const lang = reservation.lang && translations[reservation.lang] ? reservation.lang : 'es';
  const t = translations[lang];
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `Monasterio <${FROM}>`,
    to: reservation.email,
    bcc: BCC,
    subject: t.subject,
    html: buildHtml(t, reservation),
  });
}

module.exports = { sendReservationEmail };
