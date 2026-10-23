# Content Hub frontend architecture

Status: approved FSD rebuild, 2026-10-23. This document replaces the former
root `ARCHITECTURE.md`. Agent implementation and review rules live in
[`docs/agents/frontend.md`](../agents/frontend.md).

## Product and deployment

- The frontend is one React, TypeScript, Vite application. NestJS GraphQL is
  authoritative for data, authentication, ownership, roles, and publication
  state. Public readers must never receive drafts from the API.
- React Router runs in declarative SPA mode. The first release does not need
  server-side rendering. Production serves frontend and `/graphql` on the same
  origin and falls back to `index.html` for deep links. Vite proxies `/graphql`
  to the backend during development.
- The Signal visual direction remains the baseline: minimal editorial UI,
  Outfit headings, DM Sans body text, visible media, one-column phone layout,
  English product copy, and light/dark themes. The selected colors are the
  semantic tokens in `frontend/src/app/styles/content-hub-theme.css`.

## Feature-Sliced Design

The `frontend/src` tree follows FSD, using only layers needed by current code:

```text
src/
  app/                 entry composition, router, Apollo client, global styles
  pages/               catalog, content, account access, account, not found
  widgets/             site layout and its private UI
  entities/            account session and account GraphQL operations
  shared/              generated GraphQL documents, generic URL helper
  main.tsx             React entry point
```

Add `features/` when a user action deserves an independently used slice. Do
not create empty layers or one-file pass-through slices. Page-only behavior
stays within its page slice. Slices use `ui`, `model`, `api`, `lib`, or `config`
segments as needed. A module may depend only on lower layers; slices on the
same layer stay independent. Outside imports go through a slice's `index.ts`.
Generated GraphQL output under `shared/api/gql` is a tool-owned exception and
may be imported from its generated entry files.

The catalog page illustrates the split: `model/catalog-filters.ts` owns URL
filter state, `model/use-catalog-data.ts` owns queries and pagination, and
`ui/` owns the filter controls, cards, result states, and page composition.
This division follows responsibilities; file length alone does not decide a
module seam.

## Data and session

- Apollo Client is the sole server-data cache. `publishedContents` pagination
  partitions by search/type/category/tag/author and deduplicates merged IDs.
  The URL owns catalog filters. Local React state owns transient UI details.
  Add a separate client-state store only for a demonstrated shared-state need.
- Keep `.graphql` operations beside their consuming slice and regenerate
  `frontend/src/shared/api/gql/` after GraphQL documents or
  `backend/schema.gql` change. Never edit generated output by hand.
- The refresh token is only in an HttpOnly cookie; the access token is only in
  browser memory. The frontend sends the access token as a Bearer header,
  refreshes at startup and at most once on an expired operation, and clears
  user-scoped Apollo cache on account change or logout. Only the theme
  preference belongs in `localStorage`.
- Cookie-backed mutations require same-origin deployment, POST-only state
  changes, Origin verification, and appropriate cookie attributes. The API
  owns this CSRF policy.
- API resolvers enforce role, ownership, and publication rules. Frontend route
  guards improve UX and are not an authorization mechanism. Forms validate
  for feedback; the API validates independently.
- Every data screen needs explicit loading, empty, error, and unavailable or
  access-denied states as applicable. Do not display raw backend errors to
  public users.

## Content and media

- Existing plain-text bodies render as escaped paragraphs. Planned Tiptap
  bodies use versioned JSON in the `body` field, with API allowlist validation
  and read-only rendering of known nodes. Existing text is converted only
  when edited or through an explicit migration.
- External media URLs accept only HTTP(S). YouTube videos embed through
  `youtube-nocookie.com`; Spotify episodes or shows embed through Spotify.
  Other valid URLs open at their source. Invalid URLs render neither player
  nor link. Failed thumbnails use abstract artwork.

## Theme and dependencies

- Tailwind utilities provide layout and interaction styles; semantic CSS
  variables provide colors and typography. The saved manual theme applies in
  `index.html` before React paints. Without an override, the UI follows OS
  changes. Keep both parts when modifying theme behavior.
- Keep Apollo, React Router, GraphQL Code Generator, React Hook Form, Zod,
  Playwright, and Tailwind. Add a UI library, client-state store, or other
  dependency only for a demonstrated need in the consuming change.
- Planned editor work may add Tiptap. It is not part of the current frontend
  rebuild and must preserve the body-format and validation rules above.

## Verification

From `frontend/`, run `npm run format:check`, `npm run lint`,
`npm run build`, and `npm run test:e2e -- --workers=2`. Browser tests cover
desktop and phone. If a change touches the backend GraphQL contract, also run
the relevant GraphQL HTTP E2E tests in `backend/`. Review the diff against
[`docs/agents/frontend.md`](../agents/frontend.md) before committing.

## References

- [FSD overview](https://feature-sliced.design/docs/get-started/overview),
  [migration](https://feature-sliced.design/docs/guides/migration/from-custom),
  and [public APIs](https://feature-sliced.design/docs/reference/public-api)
- [React state structure](https://react.dev/learn/choosing-the-state-structure)
- [Apollo cache](https://www.apollographql.com/docs/react/caching/overview)
