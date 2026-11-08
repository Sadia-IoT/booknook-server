# AGENTS.md

REST API for BookNook: Express 5 + the official `mongodb` driver (no ORM/Mongoose), TypeScript in CommonJS.

## Commands

- `npm run dev` — starts `src/server.ts` via `tsx watch` (no build step needed).
- `npm run build` — `tsc`, emits JS + `.d.ts` + source maps to `dist/`.
- `npm start` — runs `dist/server.js`; **requires `npm run build` first** or it runs stale output.
- There are no test, lint, or format scripts in this repo. Do not invent them.

## Setup / runtime

- `.env` (gitignored) must define `MONGODB_URI` and `DB_NAME`; `PORT` is optional (default `5000`).
- The server does not listen until MongoDB connects. `connectDB()` calls `process.exit(1)` on failure, so a bad/missing URI looks like a silent exit, not a thrown error.
- `src/config/db.ts` sets DNS servers to `8.8.8.8`/`8.8.4.4` before creating `MongoClient` (needed for MongoDB Atlas SRV lookups in this environment). Keep that line.
- `getDB()` is only usable after `connectDB()` resolves — never call it at module top level.

## Architecture

- `src/server.ts` — app wiring: CORS, JSON body parsing, mounts routers, `/health`.
- `src/routes/bookRoutes.ts` — CRUD under `/books` (`GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`).
- `src/routes/borrowRoutes.ts` — `/borrows` (`GET ?email=`, `POST /`, `PATCH /:id/return`).
- `src/config/db.ts` — singleton `MongoClient`, exports `connectDB()` and `getDB()`.
- No models/schema layer: routes query the `books` and `borrows` collections directly. Collection names are string literals; changing them requires editing routes.

## Conventions and gotchas

- Every response uses `{ success, message, data? }`; errors are `500` with `success: false` and generic messages.
- Validate IDs with `ObjectId.isValid()` before building `new ObjectId(...)`; malformed IDs must return `400`, not `500`.
- `POST /books` ignores any `availableCopies` in the body and sets it equal to `totalCopies`.
- Borrow/return adjusts `books.availableCopies` via `$inc`; keep the borrow record and book copy count changes together.
- Handlers use explicit `try/catch` and do not throw to a global error middleware (there is none).
- TypeScript is `strict` and `rootDir` is `src`, so new code must live under `src/` to be compiled.
