# Frontend implementation and review rules

Read [`docs/frontend/architecture.md`](../frontend/architecture.md) and the
relevant `.scratch/content-hub-frontend/issues/` ticket before changing the
frontend. This file is the review checklist for handwritten frontend code.
The architecture document owns product and security decisions.

## Place code by responsibility

1. Route composition, providers, Apollo setup, and global styles belong to
   `app`. A page slice owns one route's data orchestration and view. A widget
   owns a large self-contained region used in the page or app shell. An entity
   owns reusable business data and behavior. A feature owns an independent
   user action. `shared` contains generic, business-neutral code.
2. Keep page-only logic in its page slice. Extract a feature, entity, or widget
   when its role and reuse justify a separate interface. Do not add empty
   layers, pass-through modules, or folders for hypothetical reuse.
3. Use segments by purpose (`ui`, `model`, `api`, `lib`, `config`). Avoid broad
   `components`, `hooks`, `types`, `utils`, or `constants` folders.
4. Import only from lower layers. Slices on the same layer must not import
   from each other. External callers import a slice through its `index.ts`;
   keep internal imports relative. Export only what callers need.
5. `.graphql` operations stay with the slice that owns the request. GraphQL
   Code Generator owns `src/shared/api/gql/`; generated files are exempt from
   handwritten style and size review. Regenerate them when operations or the
   backend schema change.

`npm run lint:architecture` enforces the machine-checkable FSD rules. If it
reports a small single-use slice, first consider keeping that code private to
its caller instead of disabling a rule.

## Keep React code readable

- Each file should have a clear reason to change. A page should coordinate
  modules, not combine requests, URL parsing, business rules, error handling,
  and hundreds of lines of JSX. Split by responsibility, not an arbitrary
  line count. Review large files for mixed concerns and tiny files for
  unnecessary indirection.
- Keep rendering pure. Put user-triggered effects in handlers and external
  synchronization in effects or purpose-named custom Hooks. Derive values
  from props, URL, query results, or existing state during render when
  possible; do not mirror them in another state variable or effect.
- Keep state near its owner: URL for shareable filters, Apollo for server
  data, local React state for transient UI. Add a global store only when a
  concrete cross-slice client-state problem cannot be handled clearly with
  these owners. Never place tokens or private Apollo data in browser storage.
- Make loading, empty, error, retry, and unavailable states explicit. Prefer
  early returns or a named state view over nested ternary chains. A simple
  ternary is fine when both branches are immediately understandable.
- Name booleans and handlers for their meaning. Prefer a small lookup table
  or named function to repeated conditional class strings. Extract a custom
  Hook only when it gives the caller a smaller, clearer interface.
- Keep event handlers focused. Avoid duplicating GraphQL requests, URL
  parsing, provider allowlists, or authentication lifecycle logic across
  screens. Treat user-visible errors as part of the interface.
- Preserve accessible names, keyboard focus, responsive layout, and both
  themes. Keep public copy in English and follow the Signal visual direction.

## Review gate

Run from `frontend/`:

```sh
npm run format:check
npm run lint
npm run build
npm run test:e2e -- --workers=2
```

During review, report findings before requesting permission to commit or
push. Check that:

- Every changed file has one coherent responsibility and a useful interface.
- No import bypasses a slice's public API or points upward or sideways in FSD.
- New dependencies solve an identified need and do not duplicate Apollo or
  local state ownership.
- GraphQL documents and generated output match the backend schema; API-side
  publication and authorization rules remain authoritative.
- URL, workflow, or visual changes are explained and exercised by relevant
  desktop and phone browser scenarios. Backend contract changes also have
  GraphQL HTTP E2E coverage.
- Existing uncommitted work is preserved; generated files and unrelated
  backend changes are not silently overwritten.

`prettier` handles layout; `oxlint` handles code rules; Steiger checks FSD.
Review still judges naming, responsibility, clarity, accessibility, and
behavior because formatters cannot assess those properties.
