# Sentriq MSP Demo

Vercel preparation of the supplied Sentriq project. No deployment or GitHub push was performed during preparation.

## 1. Upload the extracted code to GitHub

Target repository: https://github.com/sushmakiran0612-alt/Sentriq

Use GitHub Desktop to preserve the folder structure and include hidden configuration files:

1. Download and extract `Sentriq-Vercel-Ready.zip`.
2. In GitHub Desktop, sign in and choose **File → Clone Repository → URL**. Paste the repository URL above and choose a local folder.
3. Open that cloned folder in Finder or File Explorer. Copy the **contents** of the extracted `Sentriq-Vercel-Ready` folder into it. `package.json`, `pnpm-lock.yaml`, `vercel.json`, `api`, `artifacts`, and `lib` must appear directly at the repository root, not inside another folder.
4. Include `.gitignore`, `.npmrc`, and `.node-version`. On a Mac, press **Command + Shift + .** to show hidden files. Do not replace the clone's `.git` folder; the ZIP does not contain one.
5. Review GitHub Desktop's Changes tab. If the repository already has unrelated work, reconcile it before committing; do not delete unrelated files or overwrite them blindly.
6. Commit with a message such as `Prepare Sentriq demo for Vercel`, then click **Push origin**. Verify the files appear on GitHub.

For an empty repository, GitHub's **uploading an existing file** / **Add file → Upload files** also works. Upload extracted files and folders, not the ZIP; use Desktop if the browser rejects the file count. Ensure hidden configuration files are included.

**If this repository is already connected to a hosting service, pushing can trigger a deployment. Pause its automatic deployments first if you want to upload without publishing.**

## 2. Deploy on Vercel when you are ready

These are instructions for a later action; nothing has been deployed.

1. Sign in at https://vercel.com and choose **Add New → Project**.
2. Connect GitHub if needed and import `sushmakiran0612-alt/Sentriq`.
3. Keep **Root Directory** at the repository root (`.`). Do not select `artifacts/sentriq-demo`: the app needs the workspace packages above it.
4. Confirm these settings (the commands and output directory are supplied by `vercel.json`):

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Node.js | 24.x |
| Install command | `corepack pnpm install --frozen-lockfile` |
| Build command | `corepack pnpm run build:vercel` |
| Output directory | `artifacts/sentriq-demo/dist/public` |
| App secrets / database | None required for the current demo |

5. Leave `PORT`, `BASE_PATH`, and Replit variables unset. The normal deployment serves the app at `/`.
6. Click **Deploy** only when you intend to publish. Once it succeeds, open the assigned URL.
7. Check the MSP **Prospect / Pre-onboarding** entry, MSP active clients, and the client workspace. In the prospect journey, confirm Meridian Capital stays selected. Check proposal clarification/reapproval and activation, and refresh the page in the same tab.
8. Visit `/api/healthz`; it should return `{"status":"ok"}`.

Future pushes to the connected production branch may automatically deploy updates.

## Local use

Install Node.js 24 and Corepack if your Node distribution does not include it, then run these commands from the extracted project root:

```sh
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open http://localhost:5173. No `.env` file is required for the demo.

```sh
corepack pnpm test                 # Existing journey and decisioning tests
corepack pnpm run build            # Typecheck and build every workspace app
corepack pnpm run build:vercel     # Typecheck all; build the deployed demo
corepack pnpm --filter @workspace/sentriq-demo run serve
```

`serve` previews the built frontend locally. To run the standalone API locally, set `PORT=5000` and run `corepack pnpm --filter @workspace/api-server run dev` (PowerShell: set `$env:PORT="5000"` first). Vercel uses `api/[...path].ts` instead of this persistent server.

## What was preserved

- MSP launchpad, prospect pipeline, vendors, service packages, proposals, activation, governance, audit, and active-client monitoring.
- Client entry by organization/lifecycle, manual intake and CSV/image attachments, clarification and versioned approvals, onboarding, and monitoring.
- Organization/persona isolation, decision queues, policy enforcement, demo reset, and headless presentation mode.
- All application source and existing tests; the Express health endpoint reuses the original app and validation schema.
- Database, API contract/code generation, and mockup sandbox source remain available in the repository. The separate mockup development tool is not part of the Sentriq public site; run it locally with `corepack pnpm --filter @workspace/mockup-sandbox run dev`.

## Existing demo limitations and future production work

The current journeys are simulated in React with in-memory and browser `sessionStorage` state. State is not a shared database and is not synchronized across users, devices, or independent browser sessions. Moving to the Vercel domain starts a new browser session; Replit session data is not migrated. This behavior was preserved.

Persona switching is demo behavior, not real authentication or server-side authorization. CSV/image handling is a local demonstration, not durable cloud file storage. The database schema is an empty scaffold and the active backend only implements `/api/healthz`; it does not run live MSP agents, discovery, or integrations. No functionality had to be removed for Vercel.

For a real multi-user service, implement authenticated tenant-scoped APIs, persistent PostgreSQL tables, durable object storage, and real integration/worker services. The retained database package requires a separately provisioned PostgreSQL service and a server-only `DATABASE_URL` when it is used. Provision a suitable pooled connection and explicit migrations; do not rely on local files or function memory as persistent storage. Long-running agent tasks would need an appropriate background execution service. None of those new services are needed to host this existing demo.

The UI retains its Google Fonts request; if that request is unavailable, the CSS fallback font is used.

## Configuration changes

- Pinned pnpm 10.32.1 and Node 24; kept the pnpm workspace and lockfile.
- Defaulted Vite's local port and root base path; Replit diagnostic plugins only run in Replit development, not production.
- Restored cross-platform optional native dependencies so the project can also be installed on Mac/Windows. Kept dependency release-age protection.
- Added root Vercel settings, an API function adapter, and SPA fallback excluding `/api/` routes.
- Replaced the shell-only preinstall check with a portable pnpm check that does not delete lockfiles.
- Added Node types for the API adapter and a socket-free invocation of the existing Node tests.
- Added secret/build/cache exclusions. Dependencies, build output, Git history, editor/agent state, Replit metadata, and temporary files are excluded from the ZIP.

See `VALIDATION.md` for verification results and remaining validation limits.

References: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Node.js functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel project configuration](https://vercel.com/docs/project-configuration).
