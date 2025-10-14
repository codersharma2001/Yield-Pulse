# YieldPulse ⚡

Full-stack command center for ERC-4626 yield vaults. YieldPulse brings vault analytics, Tenderly-powered simulations, and wallet execution together so you can scout and act on strategies across Aave, Curve, Pendle, and more from one dashboard.

---

## Highlights
- **Unified analytics:** Normalises ERC-4626 metrics into comparable APY, TVL, and capacity signals across chains.
- **Actionable simulations:** Tenderly-backed preflight checks for deposits/withdrawals directly inside the UI.
- **Wallet-native UX:** Wagmi/WalletConnect flows with chain selectors, environment toggles, and responsive design.
- **Modular stack:** Fastify API/indexer, TypeScript SDK, Foundry contracts, and Next.js frontend wired by Turborepo.

---

## Monorepo Layout
```
root/
  apps/
    api/        # Fastify API, indexer façade, Tenderly proxy
    web/        # Next.js frontend (YieldPulse UI)
  packages/
    sdk/        # Shared TypeScript SDK (types + helpers)
    contracts/  # Foundry contracts and libraries
    ui/         # Shared component primitives (placeholder)
  docs/         # Diagrams, playbooks
  ops/          # Subgraph/Substreams configs, docker assets
```

---

## Tech Stack
- **Build system:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 14, React 18, Tailwind, Framer Motion, Wagmi, Viem
- **Backend:** Fastify 4, Zod validation, Tenderly integration hooks
- **Contracts:** Foundry + OpenZeppelin + forge-std tooling
- **Tooling:** TypeScript everywhere, ESLint/Prettier, Vitest, tsup, tsx

---

## Quick Start
> Requirements: Node.js 20.x, pnpm 8.x, Foundry (for contract builds)

```bash
pnpm install
pnpm dev            # runs all dev scripts via Turborepo
```

Common scoped commands:
```bash
pnpm --filter @yield-dashboard/web dev     # frontend only
pnpm --filter @yield-dashboard/api dev     # API only
pnpm --filter @yield-dashboard/sdk build   # build shared SDK
pnpm turbo run lint                        # lint all packages
```

---

## Environment Variables

### Frontend (`apps/web`)
Set these in Netlify (or `.env.local` for local dev):
```
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
NEXT_PUBLIC_NETWORK_ENV=testnet            # or mainnet
NEXT_PUBLIC_WALLETCONNECT_ID=wc_project_id # optional but recommended
NEXT_PUBLIC_COMMIT_SHA=dev                 # shown in footer, optional
```

### API (`apps/api`)
```
PORT=3001
LOG_LEVEL=info
CORS_ORIGIN=https://yieldpulse.app        # comma-separated list allowed
NETWORK_ENV=testnet                       # mainnet | testnet
TENDERLY_PROJECT=...
TENDERLY_ACCESS_KEY=...
```
> Configure additional secrets (Redis, RPC URLs, etc.) as integrations land.

---

## Deployment Playbook

### Frontend → Netlify
Netlify picks up configuration from `netlify.toml`.
1. Connect the Git repository.
2. Add the frontend env vars above via the Netlify UI (mark secrets as such).
3. Trigger a deploy. Netlify runs `pnpm turbo run build --filter=@yield-dashboard/web` which builds dependencies (SDK, etc.) before the Next.js app. Output is served from `apps/web/.next` via the official Netlify Next.js adapter.

### API → Your Choice (Render/Fly.io/etc.)
1. Build: `pnpm --filter @yield-dashboard/api build`.
2. Deploy the resulting Node service (or create a Docker image).
3. Provide the API env vars on the host (PORT, LOG_LEVEL, Tenderly keys, RPC endpoints, etc.).
4. Expose HTTPS endpoint and point the frontend’s `NEXT_PUBLIC_API_BASE_URL` to it.

### Contracts / Indexer
Contracts are built with Foundry: `cd packages/contracts && forge build`. Deployment scripts / addresses will live under `ops/` (work in progress).

---

## Testing & Scripts
- `pnpm turbo run lint` – ESLint across workspaces.
- `pnpm turbo run test` – Vitest suites (SDK/API as they land).
- `pnpm turbo run build` – Full build matrix with dependency graph.
- `pnpm --filter @yield-dashboard/api dev` – Fastify server with hot reload.
- `pnpm --filter @yield-dashboard/web dev` – Next.js dev server with HMR.

---

## Roadmap
1. Wire live indexers + caching into the API, replace seeded data.
2. Add authenticated operator flows: vault management, risk overrides.
3. Expand contract suite with ERC-4626 factory, strategy adapters, security reviews.
4. Harden testing (Foundry fuzzing, Slither, e2e Playwright) and document runbooks.

---

## Disclaimer
YieldPulse is for demonstration and educational purposes only. Nothing here constitutes financial advice. Use at your own risk.

---

## License
[Apache-2.0](./LICENSE)
