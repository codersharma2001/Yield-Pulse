# Yield Dashboard Monorepo

> Cross-chain ERC-4626 vault control plane spanning Aave, Curve, and Pendle integrations.

This repository hosts the full-stack implementation for the Yield Dashboard project. The initial scaffold establishes a Turborepo-powered pnpm workspace with dedicated packages for smart contracts, a TypeScript SDK, shared UI primitives, a Fastify-based API/indexer service, and a Next.js frontend.

## Structure

```
root/
  apps/
    web/      # Next.js frontend (wallet flows, Tenderly simulations)
    api/      # Fastify API + indexer aggregation services
  packages/
    contracts/  # Foundry smart contracts
    sdk/        # TypeScript SDK for frontend/backend consumption
    ui/         # Shared React component library
  ops/
    subgraphs/  # The Graph/Substreams configs per protocol
    docker/     # Container and deployment assets
  docs/
    diagrams/   # Mermaid sources + rendered exports
  .github/workflows/  # CI pipelines (to be added)
```

## Getting Started

> Tooling assumes Node.js 20.x and Foundry installed locally. All commands are pnpm-based.

```bash
pnpm install
pnpm dev
```

The `dev` script fans out to each workspace via Turborepo. Individual workspaces expose their own scripts (`pnpm --filter @yield-dashboard/web dev`, etc.).

## Deployment

### Netlify (frontend)

This repo ships with `netlify.toml`, so connecting the repository to Netlify automatically picks up the Next.js build.

1. Set required frontend environment variables in the Netlify dashboard (`NEXT_PUBLIC_API_BASE_URL`, RPC URLs, Tenderly keys, etc.).
2. Ensure the API is reachable from the deployed site and update `NEXT_PUBLIC_API_BASE_URL` accordingly.
3. Trigger a deploy—Netlify runs `pnpm --filter @yield-dashboard/web build` and publishes `apps/web/.next` using the official Next.js adapter.


## Next Steps (per delivery plan)

1. Flesh out ERC-4626 vault, factory, bridge adapters, and metrics registry contracts with full access control and testing harnesses.
2. Stand up The Graph/Substreams indexers and wire the Fastify API with caching, risk checks, and Tenderly simulation proxying.
3. Build the production-ready Next.js UI with wagmi, chain selectors, vault tables, charts, and end-to-end simulation + deposit flows.
4. Harden security: Foundry fuzz/invariant suites, Slither, upgrade guards, and documentation (Security.md, runbooks, OpenAPI specs).

> ⚠️ **Disclaimer:** This project is for demonstration and educational use only. It does not constitute financial advice.

## License

Apache-2.0
