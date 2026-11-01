# SocialBoost — Social Media Services Management Dashboard

**Personal portfolio project by Reza Moshfegh** · Node.js · Express · SQLite · Vanilla JavaScript

SocialBoost is a Persian, right-to-left web application prototype that demonstrates common workflows in a social media services dashboard: browsing services, creating orders, viewing account information, wallet activity, transactions, and support messages.

> **Release status:** Portfolio prototype only. The current codebase is not production-ready for real customer accounts or financial data. Server-side authentication, authorization for every user-owned operation, payment verification, input hardening, and a security review are still required before public production deployment.

## Current UI scope

- Landing page and service dashboard
- Service catalogue and order form
- Orders, profile, wallet, and transaction pages
- Customer support interface
- Persian RTL interface
- Server-side integration point for a third-party service provider API

## Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite via `node-sqlite3-wasm`
- **Frontend:** HTML5, CSS3, vanilla JavaScript
- **Integration:** HTTP API / `fetch`
- **Password hashing:** `bcryptjs` is used for newly registered passwords in this portfolio copy

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env
# Optionally add a newly generated provider API key to .env
npm start
```

Open `http://localhost:3000`.

Provider-backed features require `MASTER_SMM_API_KEY`. Without it, those endpoints remain unavailable while the local interface can still be inspected.

## Project structure

```text
SocialBoost/
├── public/                 # Browser-accessible assets only
├── data/                   # Local SQLite database (git-ignored)
├── server.js
├── package.json
└── .env.example
```

## Security and demo limitations

- This public portfolio copy excludes databases, user records, backups, Git history, provider dumps, and credentials.
- The provider API key is read from the `MASTER_SMM_API_KEY` environment variable. Any key previously committed or shared in source files must be revoked and replaced.
- Passwords for newly registered accounts are hashed with `bcryptjs`; however, some user-specific endpoints still trust a user ID supplied by the browser. A secure session/token model and ownership checks are required before deployment.
- Wallet balance changes are not a payment system. Real payments must be verified server-side through a trusted payment gateway.
- **Do not deploy this version for real users or real financial information.** Treat it as a portfolio prototype pending authentication/authorization redesign and independent security review.

## Screenshots

See `screenshots/` for the visual project gallery included in the portfolio bundle.

## Author

**Reza Moshfegh** — Gilan, Iran
