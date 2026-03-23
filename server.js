require('dotenv').config({ path: '.env' });
const express = require('express');
const https = require('https');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');
const { sendReservationEmail } = require('./email');
const { sendTelegramNotification } = require('./telegram');

const app = express();
const PORT = process.env.PORT || 3001;
const CORRECT_PIN = '5822';

// --- PIN Session Store (in-memory) ---
const sessions = new Set();

// --- IP Rate Limiting for PIN attempts ---
const ipAttempts = new Map();
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 5 * 60 * 1000;

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

function isBlocked(ip) {
  const entry = ipAttempts.get(ip);
  if (!entry?.blockedUntil) return false;
  if (Date.now() < entry.blockedUntil) return true;
  ipAttempts.delete(ip);
  return false;
}

function recordFailedAttempt(ip) {
  const entry = ipAttempts.get(ip) || { count: 0, blockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) entry.blockedUntil = Date.now() + BLOCK_DURATION_MS;
  ipAttempts.set(ip, entry);
}

function resetAttempts(ip) { ipAttempts.delete(ip); }

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());

const PUBLIC_PREFIXES = ['/css/', '/js/', '/images/', '/locales/'];

function isAuthenticated(req) {
  const token = req.cookies?.mono_session;
  return token && sessions.has(token);
}

function createSession(res) {
  const token = crypto.randomUUID();
  sessions.add(token);
  res.cookie('mono_session', token, { httpOnly: true, sameSite: 'strict', secure: true, maxAge: 24 * 60 * 60 * 1000 });
}

function pinGuard(req, res, next) {
  if (PUBLIC_PREFIXES.some((p) => req.path.startsWith(p))) return next();
  if (req.path === '/api/verify-pin') return next();
  if (isAuthenticated(req)) return next();

  if (req.query.pin === CORRECT_PIN) {
    const ip = getClientIp(req);
    createSession(res);
    resetAttempts(ip);
    return res.redirect(req.path === '/' ? '/' : req.path);
  }

  res.sendFile(path.join(__dirname, 'public', 'pin.html'));
}

app.use(pinGuard);
app.use(express.static(path.join(__dirname, 'public')));

// --- API: Verify PIN ---
app.post('/api/verify-pin', (req, res) => {
  const ip = getClientIp(req);

  if (isBlocked(ip)) {
    const entry = ipAttempts.get(ip);
    return res.status(429).json({ blocked: true, secondsLeft: Math.ceil((entry.blockedUntil - Date.now()) / 1000) });
  }

  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'No PIN provided' });

  if (pin === CORRECT_PIN) {
    resetAttempts(ip);
    createSession(res);
    return res.json({ success: true });
  }

  recordFailedAttempt(ip);
  const entry = ipAttempts.get(ip);
  if (entry?.blockedUntil) {
    return res.status(429).json({ blocked: true, secondsLeft: Math.ceil(BLOCK_DURATION_MS / 1000) });
  }
  res.status(401).json({ error: 'Invalid PIN', attemptsLeft: Math.max(0, MAX_ATTEMPTS - entry.count) });
});

// --- Pages ---
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// --- Reservations API ---
app.post('/api/reservations', async (req, res) => {
  const { name, email, phone, date, time, guests, notes, lang } = req.body;
  if (!name || !email || !date || !time || !guests) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const reservation = await db.createReservation({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      date, time,
      guests: parseInt(guests, 10),
      notes: notes ? notes.trim() : null,
      lang: lang || 'es',
    });
    sendReservationEmail(reservation).catch((err) => console.error('[email] Failed:', err.message));
    sendTelegramNotification(reservation).catch((err) => console.error('[telegram] Failed:', err.message));
    res.status(201).json({ success: true, id: reservation.id });
  } catch (err) {
    console.error('[reservation] Error:', err.message);
    res.status(500).json({ error: 'Could not save reservation' });
  }
});

app.get('/api/reservations', async (_req, res) => {
  try {
    res.json(await db.getAllReservations());
  } catch {
    res.status(500).json({ error: 'Could not fetch reservations' });
  }
});

app.patch('/api/reservations/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await db.updateStatus(id, status);
    res.json(await db.getReservation(id));
  } catch {
    res.status(500).json({ error: 'Could not update reservation' });
  }
});

// --- Start ---
db.init().then(async () => {
  // HTTP server on port 3080 solely for Let's Encrypt ACME challenges
  // (docker-compose maps host port 80 → container port 3080)
  const http = require('http');
  const acmeApp = express();
  acmeApp.use('/.well-known/acme-challenge', express.static('/var/www/certbot/.well-known/acme-challenge'));
  acmeApp.use((_req, res) => res.redirect(301, `https://chausseestr.dynv6.net:3001${_req.url}`));
  http.createServer(acmeApp).listen(3080);
  const sslKey  = process.env.SSL_KEY  || '/app/ssl/key.pem';
  const sslCert = process.env.SSL_CERT || '/app/ssl/cert.pem';

  const serverOptions = fs.existsSync(sslKey) && fs.existsSync(sslCert)
    ? { key: fs.readFileSync(sslKey), cert: fs.readFileSync(sslCert) }
    : null;

  if (serverOptions) {
    https.createServer(serverOptions, app).listen(PORT, () => {
      console.log(`\n  MONASTERIO — Palma de Mallorca`);
      console.log(`  Server: https://localhost:${PORT}/?pin=${CORRECT_PIN}`);
      console.log(`  Admin:  https://localhost:${PORT}/admin\n`);
    });
  } else {
    // Fallback to HTTP (local dev without certs)
    app.listen(PORT, () => {
      console.log(`\n  MONASTERIO — Palma de Mallorca`);
      console.log(`  Server: http://localhost:${PORT}/?pin=${CORRECT_PIN}`);
      console.log(`  Admin:  http://localhost:${PORT}/admin\n`);
    });
  }
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
