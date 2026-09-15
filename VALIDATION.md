# Validation — 15 September 2026

Prepared locally from the supplied Sentriq MSP Demo ZIP with Node.js 24.19.0 and pnpm 10.32.1. Nothing was pushed, published, or deployed.

| Check | Result |
| --- | --- |
| Dependency installation | Passed; native esbuild postinstall completed |
| Final `pnpm install --frozen-lockfile` | Passed; lockfile matches manifests |
| `pnpm run build` | Passed; all workspace typechecks, API adapter typecheck, mockup sandbox, API server, and Sentriq frontend builds |
| `pnpm run build:vercel` | Passed without PORT, BASE_PATH, DATABASE_URL, or Replit environment requirements |
| `pnpm test` | Passed: 32 Vitest tests and 4 Node policy-impact tests |
| API adapter HTTP smoke check | `/api/healthz` → 200 with `{"status":"ok"}`; unknown API path → 404 |
| Production Vite preview HTTP check | Built HTML, JavaScript, CSS, and favicon returned 200 |
| Application source preservation | 181 original source TS/TSX/CSS files compared byte-for-byte; unchanged and none missing |
| Archive hygiene | Dependencies, Git history, environment secrets, private key files, caches, build outputs, TypeScript build state, and Replit/agent/editor metadata excluded |

## Journey coverage in the existing tests

- Separate MSP prospect, active-client, and client launchpad entry paths.
- Meridian prospect context instead of inheriting Redwood context.
- Client entry routed by lifecycle; invalid client identity rejected.
- MSP package, vendor, and prospect creation, followed by proposal sharing.
- Meridian clarification, versioned reapproval, activation, and monitoring.
- Same-tab remount persistence for clarification and journey stage.
- Tenant/persona separation, delegated approvals, queues, enforcement, policy editing, projected impact calculations, reset, and headless presentation mode.

## Fixes during verification

Added root Node type definitions for the new API adapter typecheck. Changed the Node policy test command from the `tsx` CLI to `node --import tsx --test` to avoid the environment's restricted IPC socket; the test source is unchanged.

The supplied Vite configurations required PORT and BASE_PATH even during builds. Both frontend build configurations now have local defaults. Replit diagnostic plugins are gated to Replit development. The pnpm version is pinned and the lockfile was regenerated to retain cross-platform native optional dependencies.

## Non-blocking warnings and verification limits

Vite reports a source-map diagnostic for the existing tooltip component and a frontend JavaScript chunk above 500 kB (552.24 kB / 161.60 kB gzip). Both production build commands exit successfully. These warnings were not hidden or suppressed. Optional future code splitting could improve first-load performance.

The frontend and API were exercised locally. No authenticated Vercel build, deployment, CDN rewrite execution, or hosted browser acceptance test was performed. Vercel configuration follows the documented Vite SPA / Node function structure, but final hosted routing and packaging must be confirmed when deployment is authorized. Journey tests use React Testing Library and jsdom; they are not a real-browser visual review.

The current demo has no production authentication, shared persistence, or real discovery/agent integrations. README.md explains the backend work required for a production service without removing demo functionality.
