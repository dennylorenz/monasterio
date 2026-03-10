const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = createClient({
  url: `file:${path.join(dataDir, 'monasterio.db')}`,
});

async function init() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reservations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      phone       TEXT,
      date        TEXT NOT NULL,
      time        TEXT NOT NULL,
      guests      INTEGER NOT NULL,
      notes       TEXT,
      status      TEXT DEFAULT 'pending',
      lang        TEXT DEFAULT 'es',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function createReservation(data) {
  const result = await db.execute({
    sql: `INSERT INTO reservations (name, email, phone, date, time, guests, notes, lang, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [data.name, data.email, data.phone ?? null, data.date, data.time, data.guests, data.notes ?? null, data.lang ?? 'es', data.status ?? 'confirmed'],
  });
  const row = await db.execute({
    sql: `SELECT * FROM reservations WHERE id = ?`,
    args: [result.lastInsertRowid],
  });
  return row.rows[0];
}

async function getAllReservations() {
  const result = await db.execute(`SELECT * FROM reservations ORDER BY date ASC, time ASC`);
  return result.rows;
}

async function getReservation(id) {
  const result = await db.execute({ sql: `SELECT * FROM reservations WHERE id = ?`, args: [id] });
  return result.rows[0] || null;
}

async function updateStatus(id, status) {
  await db.execute({ sql: `UPDATE reservations SET status = ? WHERE id = ?`, args: [status, id] });
}

module.exports = { init, createReservation, getAllReservations, getReservation, updateStatus };
