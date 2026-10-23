# Content Hub frontend

React, TypeScript, Vite, Apollo Client, React Router, and Tailwind CSS.

Run the backend on port 3000 and then, from this directory:

```sh
npm install
npm run dev
```

Vite proxies `/graphql` to the backend. The public catalog at `/` loads Published
Content newest first in pages. Each card links to `/content/:id`; unpublished and
missing IDs share an unavailable state. The API's `publishedContents(first, after)`
query returns up to 30 items per page, an `endCursor`, and `hasMore`.

Account recovery starts from the sign-in page at `/forgot-password`. The email link opens `/reset-password?token=...`; successful reset signs out existing sessions and returns the user to sign-in.

```sh
npm run codegen     # typed operations from ../backend/schema.gql
npm run build       # codegen, TypeScript, production bundle
npm run format      # format handwritten frontend files
npm run format:check
npm run lint        # oxlint and FSD architecture rules
npm run test:e2e    # Playwright desktop and phone tests
```

Install the Playwright Chromium browser once with `npx playwright install chromium`.
See [`docs/frontend/architecture.md`](../docs/frontend/architecture.md) for the
FSD structure and [`docs/agents/frontend.md`](../docs/agents/frontend.md) for
implementation and review rules.
