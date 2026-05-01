---
name: deploy
description: Pre-deployment hardening and prep for Next.js / React / Express.js / Supabase / Node projects deployed to a VPS with PM2. Use this skill whenever the user says "ready for deploy", "prep for deployment", "deploy this", "make this production-ready", "audit before deploy", or mentions PM2, ecosystem.config.js, VPS deployment, Express API hardening, or pushing to production. Also use it when the user wants to extract hardcoded secrets/ports into .env, run a security audit, fix the build, or restructure a Node/Next/Express codebase to industry standards before shipping. Run every step in order — do not skip steps even if the project "looks fine".
---

# Deploy — Pre-Deployment Checklist for Next.js / React / Express.js / Supabase / Node on VPS + PM2

This skill prepares a project for deployment to a VPS managed with PM2. It runs a strict, ordered checklist. The non-negotiable rules are:

1. **No hardcoded API keys, secrets, URLs, or port numbers.** Everything goes through `.env`.
2. **`npm run build` must pass cleanly.** Zero errors. Warnings are reviewed.
3. **A `ecosystem.config.js` exists** and is wired correctly for PM2.
4. **Security audit is run and findings are addressed** — both `npm audit` and code-level review.
5. **Codebase is restructured to industry standards** (moderate scope: rename + obvious folder fixes, no wholesale rewrites).
6. **The project does not break.** Behavior must be preserved end-to-end.

If any step fails, **stop and report** — do not proceed to the next step.

---

## Pre-flight: Do Not Break The Project

Before touching anything, set up versioning and a rollback point.

### Initialize git if missing

If the project has no `.git` directory, set one up so every step from here on is recoverable:

```bash
if [ ! -d .git ]; then
  git init
  # Make sure .gitignore exists with the basics before the first commit
  cat > .gitignore <<'EOF'
node_modules/
.next/
.env
.env.local
.env.*.local
logs/
*.log
.DS_Store
dist/
build/
EOF
  git add -A
  git commit -m "chore: initial commit"
fi
```

If `.gitignore` already exists, **do not overwrite it** — only ensure the entries above are present, appending what's missing.

### Take a rollback checkpoint

Whether the repo was just initialized or already existed, commit the current state of the working tree on the current branch as a single rollback point. **No new branch.** Everything stays on whatever branch the user is on; they can reset to this hash if anything goes sideways.

```bash
git add -A
git commit -m "chore(deploy-prep): checkpoint before pre-deploy audit" --allow-empty
ROLLBACK_HASH=$(git rev-parse HEAD)
echo "Rollback point: $ROLLBACK_HASH"
```

Save `ROLLBACK_HASH` and report it in the final summary. If the user wants to undo everything this skill did, they run `git reset --hard $ROLLBACK_HASH`.

### Commit between phases

After each major step in this skill, make a focused commit with a clear message:

- `chore(deploy-prep): extract secrets and ports to .env`
- `chore(deploy-prep): add ecosystem.config.js for PM2`
- `chore(deploy-prep): bump dependencies to latest secure versions`
- `chore(deploy-prep): fix build errors`
- `chore(deploy-prep): security hardening`
- `chore(deploy-prep): restructure folders and split supabase client`

These commits give the user a clean `git log` to step through, and let them `git revert` a single phase if one of them caused a regression without losing the rest.

### Read the project shape

1. **Read `package.json`** to identify: Node version, scripts, dependencies, whether it's Next.js App Router, Pages Router, or both, whether Express.js is present, and whether Supabase is server-side, client-side, or both.
2. **Identify the project topology.** This skill handles four common shapes — figure out which one you're in:
   - **Pure Next.js** — only `next` in dependencies, no `express`.
   - **Pure Express API** — `express` in dependencies, no `next`. May be plain JS or TypeScript (look for `tsconfig.json` and a `build` script that runs `tsc`).
   - **Next.js + separate Express API in one repo** — both present, usually with the API in a folder like `api/`, `server/`, or `apps/api`. Each gets its own PM2 app block and its own port.
   - **Next.js with custom Express server** — `express` is a dep but there's no separate API folder, and Next is started via a custom server file. This pattern is **discouraged** for new projects (you lose Next's standalone optimization and automatic static optimization). Flag it for the user; don't migrate without permission.
3. **Detect the Next.js router** by checking for `app/` and/or `pages/` directories. Both can coexist — handle whichever exists.
4. **Detect the Express entry point** by checking the `main` field in `package.json` and the `start` script. Common entries: `server.js`, `index.js`, `src/index.ts`, `dist/index.js` (compiled TS).
5. **Run the existing build once first** (`npm run build` for Next.js or TypeScript Express; skip if plain-JS Express has no build step) and save the output. This is an *approximate* baseline against the developer's existing `node_modules` — useful to confirm the project isn't already broken before you touch it. The **truthful** baseline (what the VPS would see on a fresh clone) gets established in Step 4a with a clean reinstall. If this approximate baseline build is already failing, fix it before going further.

If the project does not currently build, **fix the build first** before doing anything else in this skill. A broken starting state makes it impossible to tell whether your changes broke things.

---

## Step 1 — Hunt down hardcoded secrets, URLs, and ports

Scan the entire codebase for hardcoded values that belong in `.env`. Use ripgrep (or grep) with these patterns. Run them all — partial scans miss things.

```bash
# Supabase URLs and keys
rg -n --hidden -g '!node_modules' -g '!.next' -g '!.git' -g '!dist' \
  -e 'https://[a-z0-9-]+\.supabase\.co' \
  -e 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+' \
  -e 'sbp_[A-Za-z0-9]+' \
  -e 'service_role'

# Generic API keys / tokens
rg -n --hidden -g '!node_modules' -g '!.next' -g '!.git' \
  -e '(api[_-]?key|secret|token|password)\s*[:=]\s*["'\''][^"'\'']{8,}' \
  -i

# Hardcoded ports — common offenders
rg -n --hidden -g '!node_modules' -g '!.next' -g '!.git' -g '!package-lock.json' \
  -e ':3000' -e ':3001' -e ':4000' -e ':5000' -e ':8000' -e ':8080' \
  -e 'listen\s*\(\s*[0-9]{2,5}' \
  -e 'PORT\s*=\s*[0-9]{2,5}'

# Hardcoded localhost / 127.0.0.1 in source (often production-bound bugs)
rg -n --hidden -g '!node_modules' -g '!.next' -g '!.git' \
  -e 'localhost:[0-9]+' -e '127\.0\.0\.1:[0-9]+'
```

For every hit:

- **API keys / tokens / secrets / Supabase keys / DB URLs** → replace with `process.env.VAR_NAME`. Never inline.
- **Ports** → `process.env.PORT` (or a named variable like `process.env.API_PORT` for multi-service repos), with a sensible fallback only if it's a dev-only file: `const port = Number(process.env.PORT) || 3000;`. In production code paths, throw if missing rather than silently defaulting.
- **Public URLs** (e.g. site URL, callback URLs) → `process.env.NEXT_PUBLIC_SITE_URL`, etc.

### Critical Supabase rule — read this carefully

Next.js exposes any env var prefixed with `NEXT_PUBLIC_` to the **browser bundle**. This means:

- `NEXT_PUBLIC_SUPABASE_URL` — OK, public.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — OK, public (anon key is meant to be public, RLS protects data).
- `SUPABASE_SERVICE_ROLE_KEY` — **NEVER prefix with `NEXT_PUBLIC_`**. This key bypasses Row Level Security and would compromise the entire database if leaked to the client. It must only be used in server code: `app/api/`, route handlers, server actions, server components, or `pages/api/`.

After replacing, **grep again** to verify the service role key is not imported into any client component:

```bash
rg -n 'SUPABASE_SERVICE_ROLE_KEY' app/ pages/ components/ src/ 2>/dev/null | \
  grep -v 'route\.\(t\|j\)sx\?' | grep -v 'api/' | grep -v '\.server\.'
```

Any hit from a client component is a critical leak. Fix before continuing.

### Express-specific env conventions

Express has no `NEXT_PUBLIC_` rule — every env var stays server-side by default, which is good. But Express projects have their own foot-guns:

- **Validate env at boot.** Missing env vars in Express don't fail at build time (no build), they fail at request time as `undefined`-related runtime errors that are hard to diagnose. Add an env validation step at process start using `zod` or a small custom check:

```ts
// src/config/env.ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().positive(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // ...
});

export const env = schema.parse(process.env);  // throws and exits cleanly if missing/invalid
```

  Import `env` from this module everywhere instead of touching `process.env` directly. This guarantees the process won't half-start with a broken config.

- **Different port from Next.js.** If Next.js and Express coexist, give them distinct env vars (e.g., `PORT=3000` for Next, `API_PORT=4000` for Express) so they don't collide on the same host. The PM2 config below shows this.

- **No `NEXT_PUBLIC_` prefix in pure Express repos.** If you're in a pure Express repo, name vars plainly: `SUPABASE_URL`, not `NEXT_PUBLIC_SUPABASE_URL`. If Express coexists with Next.js, you can either share `NEXT_PUBLIC_SUPABASE_URL` (Express can read it too) or duplicate as plain `SUPABASE_URL` — pick one and be consistent.

### Update `.env.example`

Maintain a `.env.example` file at the project root that lists **every** env var the project uses, with placeholder values and brief comments. This is the contract for deployment. Never commit the real `.env`. Verify `.env` is in `.gitignore`.

```
# .env.example
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # SERVER ONLY

# App
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
```

---

## Step 2 — Generate `ecosystem.config.js` for PM2

The user runs Next.js in **standalone build mode** under PM2. The config below assumes that. For plain Node services in the same repo, mirror the pattern with their own entry script.

Key facts about Next.js standalone:

- Requires `output: 'standalone'` in `next.config.js` / `next.config.mjs`.
- After build, the runnable artifact is at `.next/standalone/server.js`.
- Static assets (`.next/static`) and `public/` are **not** auto-copied into `.next/standalone/`. They must be copied as part of the build/deploy step or PM2 will serve a broken site.

### Patch `next.config.js`

Ensure standalone output is enabled:

```js
// next.config.js (or .mjs)
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ...existing config preserved
};
module.exports = nextConfig;
```

If the file is `.mjs` or `.ts`, adapt syntax accordingly. Do not remove existing config — merge.

### Add a post-build copy step to `package.json`

Standalone needs static assets copied in. Update the `build` script (or add a `postbuild`):

```json
{
  "scripts": {
    "build": "next build",
    "postbuild": "cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public 2>/dev/null || true",
    "start:prod": "node .next/standalone/server.js"
  }
}
```

On Windows dev machines `cp -r` won't work — note this for the user but on a Linux VPS it's fine.

### `ecosystem.config.js` template

Place this at the project root:

```js
// ecosystem.config.js
require('dotenv').config();

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || 'app',
      script: '.next/standalone/server.js',
      cwd: __dirname,
      instances: 1,                  // standalone Next supports only 1 per port; scale via multiple apps or a load balancer
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: process.env.PM2_MAX_MEMORY || '1G',  // hard cap — PM2 restarts the app if it exceeds this. Set to ~50–70% of available VPS RAM. Common values: '512M', '1G', '2G'.
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT,
        HOSTNAME: process.env.HOSTNAME || '0.0.0.0',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        // Add other env vars as the project requires — never inline values
      },
    },
  ],
};
```

Notes:

- `require('dotenv').config()` at the top ensures the `.env` file is loaded into `process.env` before PM2 reads the config. Make sure `dotenv` is a dependency (`npm i dotenv`).
- **Never** put real values in this file. Every value flows from `process.env`.
- `HOSTNAME=0.0.0.0` is required for the standalone server to listen on all interfaces — by default it binds to `localhost` and a reverse proxy on the same machine works, but other configs (Docker, public binding) need this.
- For multi-app repos (e.g., a separate Node API alongside Next.js), add another object to `apps` with its own `script`, `name`, and `env` block — see the Express example below.

### Express app block

If the project includes an Express API (standalone or alongside Next.js), add a second entry to the `apps` array. Express **can** safely run in cluster mode — unlike Next.js standalone — provided your app is stateless or uses a shared session store (Redis, DB-backed sessions). Cluster mode gives you one process per CPU core, free.

```js
{
  name: process.env.PM2_API_NAME || 'api',
  script: process.env.API_SCRIPT || 'dist/index.js',  // 'src/index.js' for plain JS, 'dist/index.js' for compiled TS
  cwd: __dirname,
  instances: process.env.PM2_API_INSTANCES || 'max',  // 'max' = one per CPU core; set a number to cap
  exec_mode: 'cluster',
  autorestart: true,
  watch: false,
  max_memory_restart: process.env.PM2_API_MAX_MEMORY || '1G',
  error_file: './logs/api-err.log',
  out_file: './logs/api-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  env: {
    NODE_ENV: 'production',
    PORT: process.env.API_PORT,                                   // distinct from Next.js PORT
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Add app-specific vars here, never inline
  },
}
```

Cluster-mode caveats — verify these before flipping `instances` above 1:

- **Sessions must be shared.** In-memory session stores (`express-session` default, in-memory rate limiters) break across workers. Use Redis (`connect-redis`, `rate-limit-redis`) or a DB-backed store.
- **Websockets need sticky sessions.** If you use `ws` or `socket.io`, configure your reverse proxy (Nginx `ip_hash`, etc.) to pin a client to one worker, or use the socket.io Redis adapter.
- **File uploads to local disk are not safe.** Different workers may serve different requests for the same file. Use object storage (Supabase Storage, S3) or a shared volume.
- **Cron jobs / scheduled work must run in only one worker.** Use `pm2-intercom`, a leader-election lib, or move scheduling to an external scheduler. Naïvely running `setInterval` will fire N times across N workers.

If any of those don't apply cleanly, drop to `instances: 1, exec_mode: 'fork'` and scale horizontally with multiple PM2 apps on different ports behind a load balancer.

Add `logs/` to `.gitignore` and create the directory: `mkdir -p logs`.

### Document the PM2 commands

Append to the project README a "Deployment" section with:

```bash
# First time
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed instruction once per server

# Updates
git pull
npm ci
npm run build
pm2 reload ecosystem.config.js --update-env
```

`pm2 reload` (vs `restart`) gives zero-downtime reload. `--update-env` makes PM2 re-read the env block when `.env` changes.

---

## Step 3 — Build must pass

Run a clean build. Treat any error as a blocker.

For Next.js (and TypeScript Express that compiles to `dist/`):

```bash
rm -rf .next dist
npm run build
```

For plain-JS Express (no build step), substitute a syntax + type sanity pass:

```bash
node --check src/**/*.js   # or your entry tree
npx eslint .               # if eslint is configured
```

For TypeScript Express, also run a strict type check independently of the build (so type-only errors don't slip through if the build script is doing transpilation only):

```bash
npx tsc --noEmit
```

**Resolve every error.** Common Next.js build failures:

- **Type errors** (`tsc` strictness) — fix the types, do not silence with `// @ts-ignore` unless there's no other option, and if you do, leave a comment explaining why.
- **`useSearchParams` / `headers()` / `cookies()` used outside Suspense or in static pages** — wrap in `<Suspense>` or mark the route dynamic with `export const dynamic = 'force-dynamic'`.
- **Missing env vars at build time** — Next.js inlines `NEXT_PUBLIC_*` at build time. If a `NEXT_PUBLIC_*` var is missing during build, the bundle will have `undefined` baked in. Make sure `.env` (or `.env.production`) is present and complete before building on the VPS.
- **Module not found** — usually a casing issue (Linux is case-sensitive, macOS often isn't). Fix the imports, not the filenames if other code depends on them.
- **`window is not defined`** — server/client mismatch. Move the offending code into a `'use client'` component or guard with `typeof window !== 'undefined'`.
- **Image optimization errors** — domains not allowed: add to `images.remotePatterns` in `next.config.js`.

Common Express build failures (TypeScript):

- **`Cannot find module` after `tsc`** — usually `outDir` / `rootDir` mismatch in `tsconfig.json`, or the entry script in `package.json` points to a path `tsc` didn't actually emit. Verify `dist/index.js` exists after build.
- **Missing types** — install `@types/express`, `@types/node`, `@types/cors` etc. as dev dependencies.
- **ESM/CJS interop** — if the project uses `"type": "module"` in `package.json`, imports need `.js` extensions even for `.ts` files (`import './foo.js'`). If it uses CommonJS, don't use top-level `await`. Pick one and be consistent.
- **`process.env.X is possibly undefined`** — handle with the `env.ts` validator from Step 1, then import the typed `env` object instead of `process.env`.

**Do not bypass errors with `next build --no-lint` or by disabling type-checking** unless the user explicitly asks for that as a temporary measure and acknowledges the risk.

Review warnings too. ESLint warnings about React hooks dependencies, unused vars, and unescaped entities are usually real bugs.

---

## Step 4 — Security audit

The point of this step is that **the audit must reflect what the VPS will see**, not what the developer's stale `node_modules` happens to contain. Local `node_modules` drifts from `package-lock.json` over time, and stale transitive dependencies can hide vulnerabilities that surface as soon as `npm install` runs fresh on the VPS. The flow below forces a clean resolution twice — once to establish a truthful baseline, once after the fixes.

### Step 4a — Clean reinstall to establish a truthful baseline

Before any audit or bump, throw away the current `node_modules` and lockfile and resolve from scratch. This reproduces what `npm install` will do on the VPS today.

```bash
rm -rf node_modules package-lock.json
npm install
```

If this fails, **stop**. The project is already broken on a fresh clone, and that's the real first problem to fix. Common causes:

- Peer dependency conflicts that `npm` can no longer auto-resolve. Read the error, pin or upgrade the offender, retry.
- A package was unpublished or renamed. Replace it.
- A private package without registry auth. Configure `.npmrc` properly and document it in the README.

Once this clean install succeeds, **run the build immediately** to confirm the project still works against the freshly-resolved tree:

```bash
rm -rf .next dist
npm run build
```

If the build was passing before but fails now, the lockfile was masking a problem — a transitive dep just moved within its range and broke something. Diagnose and pin or upgrade as needed. Don't skip this; this is the whole point.

If the build passes, this is your **honest baseline**: the state the VPS would reach today after a `git clone && npm install && npm run build`.

### Step 4b — Audit the baseline

Now run the audit against the freshly-resolved tree. This report is the one that matters:

```bash
npm audit
```

Record the counts (critical / high / moderate / low). This is what the VPS would expose if you deployed right now, before any of the bumps in 4c.

### Step 4c — Package version hygiene

The goal is to be on the latest **patch and minor** versions of everything, and to make a deliberate decision about majors. Latest versions get the latest security fixes. Stale dependencies are the #1 reason small projects show up on shodan.

```bash
# 1. See what's outdated
npm outdated

# 2. Bump within semver range (safe — patch + minor)
npm update

# 3. Install npm-check-updates for major-version visibility (one-time)
npm i -g npm-check-updates

# 4. List what would change at the major level — DO NOT auto-apply
ncu

# 5. Re-check
npm outdated
```

The output of `npm outdated` has three columns: **Current** (installed), **Wanted** (latest within `package.json`'s semver range, what `npm update` will give you), **Latest** (newest published, possibly major).

Workflow:

- **Anything where Current ≠ Wanted** — apply with `npm update`. These are patch/minor bumps within your declared range, almost always safe.
- **Anything where Wanted ≠ Latest (major version available)** — do **not** auto-apply. List them, and for each, decide with the user:
  - **Security-critical packages** (Next.js, React, `@supabase/*`, `next-auth`, `jsonwebtoken`, anything in the auth/crypto/HTTP path) — strongly recommend upgrading to latest major. Read the release notes for breaking changes. Apply one at a time, build, smoke test, commit. Never bulk-bump majors.
  - **UI / utility packages** — upgrade if the changelog is clean, defer if breaking changes are extensive.
  - **Build tooling** — upgrade carefully; can break the toolchain.

Special attention for this stack:

- **Next.js** — major versions change routing, caching defaults, and `next/image`. Always read the upgrade guide. If the project uses both App and Pages Router, test both after upgrade.
- **Express** — major version bumps are infrequent but consequential. Express 4 → 5 (currently the active migration) changes async error handling, removes deprecated middleware, and tightens path matching. Read the migration guide before bumping. Check for usage of removed APIs (`req.param()`, `app.del()`, etc.) and deprecated body parsers.
- **`@supabase/supabase-js` and `@supabase/ssr`** — auth helpers have been renamed/restructured across majors; the cookie API in `@supabase/ssr` shifted. Verify the client/server/admin split (Step 5) still compiles after upgrade.
- **React** — React 18 → 19 changes refs, hooks behavior, and removes some legacy APIs. Test thoroughly.
- **Express middleware** (`helmet`, `cors`, `express-rate-limit`, `body-parser`) — keep on latest. These are the security perimeter; old versions are a known-CVE buffet.

### Step 4d — Second clean reinstall, then re-audit

After the bumps, do another clean reinstall. This is the lockfile that ships to the VPS, so it must be re-resolved from scratch — not patched on top of the baseline tree.

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
npm audit
```

The audit numbers from this run should be **strictly better** than the baseline from 4b. If they're not — if a bump introduced a new vulnerability — investigate. Don't ship a regression.

For each remaining vulnerability:

- **Critical / High** → must fix. Try `npm audit fix` first. If that doesn't resolve (because the fix is a major version bump), manually upgrade the offending package or its parent through `ncu` workflow above. Use `npm audit fix --force` only as a last resort, **and re-run `npm run build`** afterwards because force-upgrades can break things.
- **Moderate** → fix if a non-breaking upgrade is available; otherwise document and accept.
- **Low** → fix if cheap; otherwise document.

Never silently `npm audit fix --force` without confirming the build still passes and behavior is unchanged.

Then commit `package.json` and `package-lock.json` together: `chore(deploy-prep): bump dependencies to latest secure versions`. **The lockfile must be committed** — `npm ci` on the VPS depends on it.

### Step 4e — Code-level checks

Walk the codebase against this list. Each item is a real foot-gun in Next.js + Supabase apps:

1. **Service role key isolation** — already covered in Step 1, re-verify nothing pulled it into a client bundle.
2. **Row Level Security (RLS)** — confirm all Supabase tables that hold user data have RLS enabled. The skill cannot check the database directly, but ask the user to confirm via the Supabase dashboard. Tables without RLS + an anon key in the client = open database.
3. **Auth on API routes** — every route handler under `app/api/` and `pages/api/` that mutates data or returns user-specific data must verify the session. Look for handlers that call Supabase with the service role key without first checking the requesting user's identity.
4. **Input validation** — API routes that accept JSON should validate it (e.g., with `zod`). Look for handlers that destructure `req.body` and pass directly to a database call.
5. **Rate limiting** — auth endpoints and any endpoint that triggers email/SMS should be rate-limited. Flag if missing; recommend `@upstash/ratelimit` or a middleware-level solution.
6. **CORS** — if the API is called from other origins, configure CORS explicitly. If not, ensure no overly permissive `Access-Control-Allow-Origin: *` is set.
7. **Security headers** — add headers in `next.config.js`:

```js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    },
  ];
}
```

   Add a Content-Security-Policy too if the project is mature enough to know what it loads — otherwise flag for follow-up rather than guessing and breaking the site.

8. **`dangerouslySetInnerHTML`** — grep for it. Every use needs sanitization (DOMPurify or similar) if the input touches user data.
9. **Open redirects** — any handler that takes a `redirect` / `next` / `returnTo` query param and redirects to it must validate the target is same-origin.
10. **Logging secrets** — search for `console.log` calls that print env vars, request bodies, headers, or user objects:

```bash
rg -n 'console\.(log|info|debug)' --hidden -g '!node_modules' -g '!.next'
```

   Remove or sanitize. Production logs leak.

11. **`.env` not committed** — check `.gitignore` includes `.env`, `.env.local`, `.env.*.local`. Then `git ls-files | grep -E '^\.env'` to confirm none are tracked. If one is, **rotate every key in it** — assume it's compromised — then untrack with `git rm --cached`.
12. **Outdated framework** — if Next.js, React, Express, or `@supabase/*` are more than one major version behind, flag and discuss upgrade strategy with the user before bumping. Don't auto-upgrade majors.

### Step 4f — Express-specific security checks

Express has no security defaults — the framework gives you a request/response loop and nothing else. The perimeter is your job. Verify each of these in Express projects:

1. **`helmet()` is mounted** — sets sensible security headers (CSP, X-Frame-Options, HSTS, etc.). Mount it as one of the first middlewares:

```ts
import helmet from 'helmet';
app.use(helmet());
```

2. **`cors()` is configured with an explicit origin** — never `cors()` with no options in production (that allows any origin). Either lock to your frontend domain or use a function-based check:

```ts
import cors from 'cors';
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? false,
  credentials: true,
}));
```

3. **Rate limiting on all public routes, with stricter limits on auth.** Use `express-rate-limit`. Behind a reverse proxy, you also need `app.set('trust proxy', 1)` or `req.ip` will see the proxy IP, not the real client IP, and rate limits become useless.

```ts
import rateLimit from 'express-rate-limit';
app.set('trust proxy', 1);
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }));
```

   In cluster mode, in-memory rate limit state does not work — use `rate-limit-redis` with a shared Redis.

4. **Body size limits.** The default `express.json()` accepts unbounded payloads, which is a trivial DoS vector. Set a sensible cap:

```ts
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
```

   Bump only for endpoints that genuinely need it (file upload routes), and prefer streaming uploads over buffering.

5. **Input validation on every route.** Every `req.body`, `req.query`, `req.params` that touches the database or an external API must be validated. Use `zod` (recommended) or `express-validator`. A controller that destructures `req.body` directly and passes it to a Supabase call is a guaranteed bug, often a security one.

6. **No stack traces in error responses.** Verify the global error handler does not send `err.stack` or `err.message` raw to the client in production:

```ts
app.use((err, req, res, next) => {
  console.error(err);  // log full error server-side
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});
```

7. **Cookie hardening.** If using `cookie-parser` or `express-session`, every cookie must be `httpOnly: true`, `secure: true` (in production), and `sameSite: 'lax'` or `'strict'`. Never set sensitive cookies with default options.

8. **Async error handling.** In Express 4, async route handlers that throw don't reach the error middleware automatically — the request hangs. Either wrap every handler with a `asyncHandler` utility, use `express-async-errors` (mount it once at the top), or upgrade to Express 5 which handles this natively. Verify which approach is in use.

9. **`X-Powered-By` header disabled.** It leaks framework info. Either `app.disable('x-powered-by')` or rely on `helmet()` which removes it.

10. **`trust proxy` set correctly when behind a reverse proxy.** Without it, `req.secure`, `req.ip`, and rate limiting all see the proxy, not the client. Set it once at app boot to match your topology (`1` for one proxy hop, an IP/CIDR for stricter trust).

11. **Authentication middleware on protected routes.** Verify every route that returns or mutates user-specific data is gated by an auth middleware that validates the Supabase session — not just the presence of a token, but its signature and expiry. Look for routes that read `req.headers.authorization` without verifying.

12. **No service role client used to perform actions on behalf of an unauthenticated user.** The service role key bypasses RLS. If a route uses the admin Supabase client to read or write user data, it must first verify the requesting user's identity and authorization in code — RLS is no longer protecting you on that path.

---

## Step 5 — Restructure (moderate scope)

Goal: make the codebase look like something a new dev could navigate on day one. Do **not** do a wholesale rewrite. Do **not** rename things that are imported in 100 places unless the payoff is real.

### What "moderate" means here

- Rename obviously bad filenames (`temp.js`, `untitled-1.tsx`, `helpers2.ts`).
- Move clearly misplaced files into the right folders.
- Split files that mix server and client code (especially Supabase clients).
- Add missing standard folders.
- Do not rearrange routing structure in `app/` or `pages/` — that changes URLs.
- Do not rename exported components — that breaks imports across the project.

### Target layout — Next.js

```
project/
├── app/                      # App Router (if used)
├── pages/                    # Pages Router (if used)
├── components/               # Shared React components
│   ├── ui/                   # Generic primitives (Button, Input)
│   └── ...                   # Feature components
├── lib/                      # Non-React shared logic
│   ├── supabase/
│   │   ├── client.ts         # Browser client (anon key)
│   │   ├── server.ts         # Server client (cookies-based)
│   │   └── admin.ts          # Service-role client — server only, never imported by client code
│   └── utils.ts
├── hooks/                    # Custom React hooks
├── types/                    # Shared TypeScript types
├── public/                   # Static assets
├── styles/                   # Global styles, Tailwind config if separate
├── logs/                     # PM2 logs (gitignored)
├── .env.example
├── .env                      # gitignored
├── .gitignore
├── ecosystem.config.js
├── next.config.js
├── package.json
└── README.md
```

If the project uses `src/`, keep it — don't pull everything out. Mirror the structure inside `src/`.

### Target layout — Express

```
project/
├── src/
│   ├── index.ts              # Process entry — calls env validator, starts server
│   ├── app.ts                # Express app: middleware stack, route mounting (no .listen())
│   ├── config/
│   │   └── env.ts            # zod-validated env loader (from Step 1)
│   ├── routes/               # Route definitions (one file per resource)
│   ├── controllers/          # Request handlers — thin, delegate to services
│   ├── services/             # Business logic, no req/res awareness
│   ├── middlewares/          # Auth, error handler, rate limiters
│   ├── validators/           # Zod schemas for request bodies/queries/params
│   ├── lib/
│   │   └── supabase/
│   │       └── admin.ts      # Service-role client (Express is always server-side)
│   └── types/
├── dist/                     # Compiled output (gitignored, populated by tsc)
├── logs/                     # PM2 logs (gitignored)
├── .env.example
├── .env                      # gitignored
├── .gitignore
├── ecosystem.config.js
├── tsconfig.json
├── package.json
└── README.md
```

Splitting `app.ts` (app config) from `index.ts` (process bootstrap) is the single most useful refactor — it makes the app testable without binding a port, and gives PM2 a clean entry point.

### Monorepo layout — Next.js + Express in one repo

If both coexist, prefer a top-level split:

```
project/
├── apps/
│   ├── web/                  # Next.js project (its own package.json optional)
│   └── api/                  # Express project (its own package.json optional)
├── packages/                 # Shared code (types, supabase clients) if using workspaces
├── ecosystem.config.js       # One config, two app blocks (web + api)
├── .env                      # Shared, or split per app
└── package.json
```

Don't restructure into a monorepo as part of this skill — that's a real migration. Flag it as a recommendation if the repo is currently mixing Next.js and Express files at the root.

### The Supabase split is the most important rename

The most common bug in this stack is one Supabase client file imported from both server and client code, which causes either the service role key to leak or session cookies to misbehave. Split it:

```ts
// lib/supabase/client.ts — browser only
import { createBrowserClient } from '@supabase/ssr';
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
```

```ts
// lib/supabase/server.ts — server only (route handlers, server components, server actions)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    },
  );
};
```

```ts
// lib/supabase/admin.ts — service role, server only, never imported from client components
import { createClient } from '@supabase/supabase-js';
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
```

When updating imports across the project, do it incrementally and run `npm run build` after each batch.

---

## Step 6 — Final verification — don't break the project

After all the above, run the verification gauntlet. This step deliberately mimics what `git clone && deploy` will do on the VPS — same commands, same install path, same start path. Any deviation here from VPS behavior is a deployment bug waiting to happen.

```bash
# 1. Lockfile sanity — npm ci requires a lockfile that's in sync with package.json
[ -f package-lock.json ] || { echo "ERROR: no package-lock.json — run npm install and commit it"; exit 1; }

# 2. Clean slate — remove only build artifacts and installed deps, keep the lockfile
rm -rf node_modules .next dist
npm ci   # ci, not install — fails fast if lockfile is out of sync, exactly like VPS will

# 3. Type check (if TypeScript)
npx tsc --noEmit

# 4. Lint
npm run lint   # or: npx next lint

# 5. Build
npm run build

# 6. Final audit — must match or improve on Step 4d's numbers
npm audit

# 7. Boot under PM2 locally to smoke test
pm2 start ecosystem.config.js
sleep 5
pm2 logs --lines 50 --nostream
# Hit each app on its port — expect 200 or 3xx
curl -sS -o /dev/null -w 'web: %{http_code}\n' "http://localhost:${PORT:-3000}/"
# If Express is in the project, hit it on its own port too:
curl -sS -o /dev/null -w 'api: %{http_code}\n' "http://localhost:${API_PORT:-4000}/health"  # add a /health route if missing
pm2 delete ecosystem.config.js

# 8. Re-grep for hardcoded secrets — must return nothing
rg -n --hidden -g '!node_modules' -g '!.next' -g '!.git' \
  -e 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}' \
  -e 'service_role'
```

If `npm ci` fails with `EUSAGE` or "lock file's ... does not satisfy package.json" — the lockfile and `package.json` are out of sync. Re-run `npm install` (which updates the lockfile), commit the lockfile, and try `npm ci` again. **Never deploy without `npm ci` succeeding locally first** — that error will hit the VPS verbatim.

Then exercise the app: log in, hit a protected route, hit a public route, trigger one mutation. If anything regressed compared to the baseline build from pre-flight, find it and fix it before declaring done.

---

## Reporting back to the user

When the skill finishes, output a structured report:

```
DEPLOY PREP — <project name>
============================
Rollback point: <ROLLBACK_HASH>  (git reset --hard <ROLLBACK_HASH> to undo everything)

[OK]  Git initialized (or pre-existing) — N checkpoint commits made
[OK]  No hardcoded secrets/ports detected
[OK]  .env.example up to date — N variables
[OK]  ecosystem.config.js created at project root
[OK]  next.config.js: output: 'standalone' enabled
[OK]  Dependencies: M packages bumped within semver, K majors flagged for review
[OK]  package-lock.json regenerated and committed
[OK]  Build passed in 32.4s — 0 errors, 2 warnings (listed below)
[OK]  npm audit baseline (Step 4b, before fixes):  2 critical, 6 high, 3 moderate
[OK]  npm audit final (Step 4d, after fixes):      0 critical, 0 high, 1 moderate (accepted: <reason>)
[OK]  Code-level security review — see findings below
[OK]  Restructure: 4 files moved, Supabase client split into client/server/admin
[OK]  PM2 smoke test: app served 200 on PORT=3000
[OK]  All baseline routes responding

CHECKPOINT COMMITS (newest first):
  <hash>  chore(deploy-prep): restructure folders and split supabase client
  <hash>  chore(deploy-prep): security hardening
  <hash>  chore(deploy-prep): fix build errors
  <hash>  chore(deploy-prep): bump dependencies to latest secure versions
  <hash>  chore(deploy-prep): add ecosystem.config.js for PM2
  <hash>  chore(deploy-prep): extract secrets and ports to .env
  <hash>  chore(deploy-prep): checkpoint before pre-deploy audit  <-- ROLLBACK_HASH

MAJOR VERSION BUMPS DEFERRED FOR USER REVIEW:
  - <package>: <current> -> <latest>  (breaking changes: <summary>)

WARNINGS:
  - <warning 1>
  - <warning 2>

ACTION ITEMS FOR USER (cannot be done by skill):
  - Confirm RLS enabled on all user-data tables in Supabase dashboard
  - Rotate <KEY_NAME> if it was previously committed (git history shows: <yes/no>)
  - Run `pm2 startup` once on the VPS to enable boot persistence
  - Decide on deferred major version bumps listed above
```

If any step fails, the report leads with `FAILED AT STEP N` and stops. Do not pretend a partial pass is a full pass.

---

## Things this skill explicitly does not do

- **Does not push to the VPS.** Deployment is the user's job. This skill prepares the project; it does not transfer it.
- **Does not write CI/CD pipelines.** Out of scope unless the user asks separately.
- **Does not add tests.** Adds none, removes none.
- **Does not upgrade major versions of Next.js, React, or Supabase libraries** without the user's explicit approval.
- **Does not configure Nginx, Caddy, or SSL.** Reverse proxy and TLS are server-side concerns handled separately.
- **Does not enable PM2 cluster mode for Next.js standalone** — it doesn't work cleanly with a single-port standalone server. Scale by running multiple apps on different ports behind a load balancer if needed.

---

## Quick reference — order of operations

1. **Pre-flight:** init git if missing → checkpoint commit → record ROLLBACK_HASH → approximate baseline build.
2. **Hunt hardcoded secrets/ports** → move to `.env`, update `.env.example` → commit.
3. **Verify service role key isolation.**
4. **Patch `next.config.js`** for `output: 'standalone'`, add postbuild copy → create `ecosystem.config.js` → commit.
5. **Build must pass** — `npm run build`, fix every error → commit.
6. **Security audit (the truthful one):**
   - 6a. Nuke `node_modules` + `package-lock.json`, `npm install` → reproduces what VPS sees.
   - 6b. `npm audit` → record baseline numbers.
   - 6c. `npm outdated` + `npm update` for safe bumps; `ncu` to surface majors for user review.
   - 6d. Nuke `node_modules` + `package-lock.json` again, `npm install`, `npm run build`, `npm audit` → confirm fixes, commit lockfile.
   - 6e. Code-level checks (RLS, auth, headers, etc.).
   - 6f. Express-specific perimeter checks if applicable.
7. **Moderate restructure** — Supabase client split, obvious folder/file fixes → commit.
8. **Final verification gauntlet** — `npm ci` (matches VPS exactly), type check, lint, build, audit, PM2 smoke test.
9. **Report**, including ROLLBACK_HASH and the list of checkpoint commits.

If any step fails, stop and report. Don't paper over it. The user can `git reset --hard <ROLLBACK_HASH>` to undo everything, or `git revert <hash>` to undo a single phase.