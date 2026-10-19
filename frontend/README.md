# Content Hub frontend

React, TypeScript, Vite, Apollo Client, React Router, and Tailwind CSS.

Run the backend on port 3000 and then, from this directory:

```sh
npm install
npm run dev
```

Vite proxies `/graphql` to the backend. Published Content is available at
`/content/:id`; unpublished and missing IDs share an unavailable state.
The root route is a placeholder until the public catalog ticket is implemented.

```sh
npm run codegen     # typed operations from ../backend/schema.gql
npm run build       # codegen, TypeScript, production bundle
npm run lint
npm run test:e2e    # Playwright desktop and phone tests
```

Install the Playwright Chromium browser once with `npx playwright install chromium`.
