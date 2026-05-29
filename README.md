# 🚀 LoomRails (`create-loomrails-app`)

> A modern, polyglot monorepo starter kit designed to seamlessly unify a Ruby on Rails 8 API backend with component-driven JavaScript frontends.

LoomRails solves the administrative overhead, tech-stack bifurcation, and data contract drift that teams face when scaling beyond monolithic server-rendered views. Distributed as an intelligent, interactive CLI, it allows you to spin up a production-ready, strictly typed ecosystem in less than 60 seconds.

---

## 📦 Scaffolding Quick Start

You don't need to clone a static, bloated template. To scaffold a custom LoomRails monorepo tailored to your database, mobile, and hosting requirements, simply run:

```bash
npx create-loomrails-app@latest my-new-app
```

The interactive prompt will guide you through:
1.  **Project Name**: Renames all internal configurations (Rails, Vite, Expo, Package names).
2.  **Mobile Support**: Opt in/out of the cross-platform Expo React Native app.
3.  **Database**: Choose PostgreSQL (production) or SQLite (prototyping).
4.  **Kamal Support**: Opt in/out of production-ready containerized Docker & Kamal deployment setups.

---

## 🏛️ The Architecture

LoomRails structures your monorepo using **pnpm workspaces** and **Turborepo** for isolated module management and cached parallel task orchestration:

```text
my-new-app/
├── apps/
│   ├── api/            # Ruby on Rails 8 API-only Application
│   ├── web/            # React Single Page Application (Vite)
│   └── mobile/         # React Native Application (Expo SDK 54) [Optional]
├── packages/
│   ├── ui/             # Shared React Component Design System (peerDependencies for React)
│   ├── types/          # Synchronized TypeScript types & OpenAPI models
│   └── config/         # Shared ESLint, Prettier, and TypeScript configurations
├── turbo.json          # Turborepo cached task orchestrator
├── pnpm-workspace.yaml # Workspace package configuration
└── package.json        # Unified monorepo scripts & dev tools
```

---

## 🌟 Key Innovations & Technical Focus

### 1. Zero-Boilerplate E2E Type Safety
Contracts between your Rails backend and frontends are completely automated.
*   **Alba + Typelizer**: Rails uses **Alba** for high-performance serialization, paired with **Typelizer** to automatically inspect Alba serializers and output standard **TypeScript interfaces** and **OpenAPI schemas** directly into `packages/types/src/`.
*   **Hey API (`@hey-api/openapi-ts`)**: The generated OpenAPI schemas are compiled into 100% type-safe React Query hooks, mutations, and query keys.
*   **The Synchronized Pipeline**: When running `pnpm dev`, Turborepo runs the `rails typelizer:generate` sync task followed immediately by the Hey API compiler. Your frontend is perfectly typed *before* your local Vite/Metro servers boot.

### 2. Dual-Strategy JWT Security
To accommodate security mismatches between browsers and native sandboxes:
*   **Strategy A (Web SPA)**: The Rails API delivers stateless JWTs inside an `HTTP-Only`, `Secure`, `SameSite=Strict` cookie. This immunizes the React SPA against XSS-based token theft.
*   **Strategy B (Expo Mobile)**: The Rails API returns the JWT directly in the JSON response body (`{ "token": "ey..." }`). The mobile client stores this securely inside Keychain/Keystore via `expo-secure-store` and attaches it as a `Bearer` token inside the `Authorization` header.

### 3. Redis-Free Footprint (Solid Suite)
To drastically simplify DevOps overhead, LoomRails utilizes the database for queueing and caching:
*   **Solid Queue**: Natively processes background Active Jobs using PostgreSQL.
*   **Solid Cache**: Delivers high-performance database-backed cache stores.
Your stack footprint is minimized solely to the web containers and the database.

### 4. Kamal Deployment & SPA Fallback Routing
*   **Kamal Role Separation**: `deploy.yml` separates the Puma API container (`web` role) from the Solid Queue processor (`worker` role) so you can scale workers independently.
*   **The Health Check Trap**: Database migrations are decoupled from container boot. `db:migrate` is run exactly once on a primary host inside the pipeline to avoid timeouts on health checks.
*   **SPA Fallback Routing**: Rails is configured with a catch-all route (`get '*path', to: 'application#fallback_index_html'`) constrained to HTML requests. Since the Vite SPA assets are copied into the Rails public folder, refreshing `/dashboard` cleanly defers to the React Router.

---

## 🛠️ Prerequisites

Ensure your development machine has the following tools installed:

| Tool | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v20.x` or higher | Runs the build pipelines, Vite, and Metro bundlers |
| **pnpm** | `v10.x` or `v11.x` | Monorepo package manager (Isolated modules, fast caches) |
| **Ruby** | `v3.3.x` or higher | Runs the Rails 8 API backend |
| **Bundler** | `v2.5.x` or higher | Manages Ruby dependencies |
| **PostgreSQL** | `v16.x` *(if chosen)* | Database server for production configurations |

---

## 🚀 Local Development (Monorepo)

Once your project is scaffolded:

1.  **Install Workspace Dependencies**:
    ```bash
    pnpm install
    ```
2.  **Spin Up the Stack**:
    ```bash
    pnpm dev
    ```
    This single command boots your Rails server, mounts database accessories, runs the Typelizer compiler, and boots the Vite and Metro bundlers concurrently inside your terminal.

---

## 🧑‍💻 Developing the CLI Locally

If you want to contribute or modify `create-loomrails-app`:

1.  **Clone this Repository**
2.  **Install dependencies**:
    ```bash
    pnpm install
    ```
3.  **Compile the TypeScript CLI**:
    ```bash
    npm run build
    ```
    *Build configs are split between `tsconfig.json` (pristine for editor integration) and `tsconfig.build.json` (build-time escape hatches to ignore TS6.0 deprecation warnings).*
4.  **Run Programmatic Scaffolding Tests**:
    ```bash
    npx tsup src/test-runner.ts --format cjs --clean --tsconfig tsconfig.build.json
    node dist/test-runner.js
    ```

---

## 💬 Frequently Asked Questions (FAQ)

### Q: Why does `pnpm install` throw a `minimumReleaseAge` violation inside the monorepo?
**A:** pnpm v11+ introduces a security feature that delays installing packages published in the last 24 hours to prevent supply-chain attacks. Because LoomRails uses cutting-edge packages, we disable this check for the generated monorepo workspace by setting `minimumReleaseAge: 0` in `pnpm-workspace.yaml` and `.npmrc`. This ensures flawless, day-one installation.

### Q: Why does my physical mobile device fail to fetch the Rails backend?
**A:** Physical phones running Expo on your Wi-Fi cannot resolve `localhost` (which resolves to the device itself). LoomRails includes dynamic host resolution inside the mobile client using `expo-constants` (e.g., `Constants.expoConfig.hostUri`). The mobile app automatically detects your computer's local network IP and binds API requests to it seamlessly.

### Q: Do I need PgBouncer?
**A:** In hybrid API/mobile apps, DB connection pools can saturate quickly. In our Kamal deploy setup, we bundle a PgBouncer accessory container that manages connection pooling automatically, reducing production DB connection overhead to zero.

---

## 📄 License

LoomRails is open-source software licensed under the [MIT License](LICENSE).
