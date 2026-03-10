# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Monasterio** — Website for an upscale cocktail bar in Palma de Mallorca. Plain HTML/CSS/JS frontend served by a Node.js + Express backend. SQLite database for reservations. Resend API for transactional email. Dockerized.

## Commands

```bash
# Install dependencies (requires build tools for better-sqlite3)
npm install

# Run locally
node server.js          # or: npm start
node --watch server.js  # dev mode with auto-restart

# Docker
docker-compose up --build
docker-compose up -d    # background

# Access
# Site:  http://localhost:3001/?pin=2704
# Admin: http://localhost:3001/admin
```

## Architecture

```
server.js       Express app — PIN middleware, API routes, static file serving
db.js           SQLite via better-sqlite3 (DB file: ./data/monasterio.db)
email.js        Resend API email — sends confirmation + BCC to denny@kolor-berlin.com

public/
  index.html    Single-page site (hero, menu, reservations, reviews, about, contact)
  admin.html    Admin panel — view/confirm/cancel reservations, auto-refreshes every 60s
  pin.html      PIN entry page served to unauthenticated visitors
  css/style.css Dark luxury design system (CSS custom properties: --black, --gold, --cream)
  js/i18n.js    Language switcher — loads /locales/{lang}.json, applies data-i18n attributes
  js/main.js    Nav scroll, hamburger, menu tabs, reservation form POST, fade-in observer
  js/reviews.js Review card click → modal with full review text
  locales/      es.json (default), en.json, de.json, fr.json
  images/bar.png Bar photo used as hero background
```

## PIN System

- Correct PIN: `2704`
- All routes except static assets require authentication via `mono_session` cookie
- URL shortcut: `/?pin=2704` auto-authenticates and redirects
- After 3 wrong attempts, IP is blocked for 5 minutes (in-memory, resets on server restart)
- Session tokens stored in-memory `Set` (also resets on restart — by design for simplicity)

## i18n

HTML elements use `data-i18n="key"` attributes. `i18n.js` fetches the locale JSON and replaces `innerHTML`. The current lang is saved to `localStorage` as `mono_lang`. The hidden `<input id="form-lang">` tracks the active language so the server sends the confirmation email in the correct language.

## Environment Variables

```
RESEND_API_KEY=re_...          # Required for emails to send
FROM_EMAIL=reservas@monasterio.es
BCC_EMAIL=denny@kolor-berlin.com
PORT=3001
```

Copy `.env.example` to `.env` and fill in `RESEND_API_KEY`. Without it, reservations still save to DB but no email is sent (logged as warning).

## Design Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--black` | `#0d0a07` | Page background |
| `--dark` | `#13100c` | Cards, nav, form |
| `--gold` | `#c9a84c` | Accents, labels, CTAs |
| `--cream` | `#f5efe6` | Primary text |
| `--muted` | `#c8bfb0` | Secondary text |
| `--faint` | `#5a4e3d` | Tertiary, placeholders |

Fonts: `Playfair Display` (headings) + `Lato` (body), loaded from Google Fonts.

## Database

SQLite file at `./data/monasterio.db`. In Docker, `./data` is bind-mounted for persistence.

Schema: `reservations(id, name, email, phone, date, time, guests, notes, status, lang, created_at)`

Status values: `pending` | `confirmed` | `cancelled`
