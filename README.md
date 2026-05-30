# LoomRails (`create-loomrails-app`)

LoomRails is a scriptable CLI for scaffolding a Rails API, Vite React web app, optional Expo mobile app, and shared TypeScript contracts in one pnpm/Turborepo workspace.

The v1 goal is reliability: generate a clean app, make local setup predictable, and keep the Rails/API/client contract visible instead of hidden in hand-written fetch calls.

## Quick Start

```bash
npx create-loomrails-app@latest my-new-app
cd my-new-app
pnpm dev
```

The interactive flow asks for:

1. Project name
2. Expo mobile app: included by default
3. Rails database: PostgreSQL by default, SQLite optional
4. Kamal deployment files: included by default

For CI, demos, and repeatable scaffolds, use flags:

```bash
npx create-loomrails-app@latest my-new-app --yes --no-install --no-git
npx create-loomrails-app@latest my-new-app --database sqlite3 --no-mobile --no-kamal
```

Supported flags:

```text
--yes
--mobile / --no-mobile
--database postgresql|sqlite3
--kamal / --no-kamal
--install / --no-install
--git / --no-git
```

## Generated Architecture

```text
my-new-app/
├── apps/
│   ├── api/       # Rails 8 API-only app
│   ├── web/       # Vite React SPA
│   └── mobile/    # Expo SDK 55 app, optional
├── packages/
│   ├── types/     # OpenAPI contract and generated TypeScript client output
│   ├── ui/        # Shared UI package placeholder
│   └── config/    # Shared config package placeholder
├── .github/       # CI and Dependabot for the generated monorepo
├── turbo.json
└── pnpm-workspace.yaml
```

The API routes are namespaced under `/api/v1`. The web client reads `VITE_API_URL`; the mobile client reads `EXPO_PUBLIC_API_URL` and falls back to the Expo LAN host during development.

## Type Contract

LoomRails includes a starter OpenAPI contract at `packages/types/openapi.json` and a Rails task that regenerates it:

```bash
pnpm api:openapi
pnpm api:client
pnpm api:types
```

`pnpm api:client` runs `@hey-api/openapi-ts` from `packages/types/openapi-ts.config.ts` and writes the generated client into `packages/types/src/client`.

The current v1 contract covers the starter auth/session endpoints. Resource-level OpenAPI expansion is intentionally explicit so teams can review the API shape as they add domain models.

## Auth Model

The starter auth flow is intentionally small:

- Web uses a signed, HTTP-only cookie.
- Mobile receives a bearer token and stores it through `expo-secure-store`.
- Tokens expire after 24 hours.
- The starter does not include refresh tokens, server-side token revocation, MFA, or rate limiting.

That is enough to demonstrate browser/mobile auth differences, but production apps should add revocation and abuse controls before handling sensitive data.

## Local Development

Prerequisites:

| Tool | Version |
| --- | --- |
| Node.js | 22+ |
| pnpm | 11+ |
| Ruby | 3.3+ |
| Bundler | 2.5+ |
| PostgreSQL | 16+ when using PostgreSQL |

Run a local health check:

```bash
npx create-loomrails-app@latest doctor
# or, after a global install:
loom doctor
```

Inside a generated app:

```bash
pnpm install
pnpm api:types
pnpm dev
```

## Developing This CLI

```bash
pnpm install
pnpm build
pnpm test
npm pack --dry-run
```

`pnpm test` typechecks the CLI, builds it, and golden-tests all mobile/database/Kamal scaffold combinations without installing generated dependencies.

## License

MIT
