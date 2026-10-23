# Content Hub

This repository contains two independent applications:

- [`backend/`](backend/README.md) — NestJS GraphQL API, Prisma, PostgreSQL, and Redis.
- [`frontend/`](frontend/README.md) — React and TypeScript application created with Vite.

Install dependencies and run commands from the application directory you are working in. The API uses port 3000 by default; the Vite development server uses port 5173. The frontend has a public Content detail route and proxies GraphQL requests to the API.

Frontend architecture is documented in [`docs/frontend/architecture.md`](docs/frontend/architecture.md),
with agent review rules in [`docs/agents/frontend.md`](docs/agents/frontend.md).
Local planning artifacts in `.scratch/`, `.ua/`, and `GLOSSARY.md` remain excluded from Git.
