# GraphQL Content Hub API

A customizable content delivery platform built with **NestJS**, **GraphQL**, and **Prisma**. This API allows users to explore, create, and interact with various types of content such as articles, videos, podcasts, and news from multiple sources — all tailored to personal interests.

---

## 🚀 Features

- **User Accounts**
  - Registration, login, and profile management
  - Role-based access: `USER`, `EDITOR`, `ADMIN`

- **Content System**
  - Create and manage various content types (`ARTICLE`, `VIDEO`, `PODCAST`, `NEWS`)
  - Categorization, tagging, and sourcing of content
  - Read time estimation and media support

- **Social Features**
  - **Comments**: Hierarchical commenting system with replies and nesting
  - **Reactions**: Like, dislike, and save content with real-time counts
  - **View Tracking**: Anonymous and authenticated view analytics
  - **Tag System**: Content categorization with popular tag insights

- **Analytics & Insights**
  - View tracking with duration analysis
  - Content popularity metrics
  - User engagement statistics
  - Reaction analytics and trends

- **Custom Feeds & Subscriptions**
  - Personalized feeds based on followed categories, authors, and sources
  - Smart filtering and recommendation logic
  - Subscription management (`AUTHOR`, `CATEGORY`, `SOURCE`)

- **Notifications**
  - In-app notifications about updates, new content, and more

- **Admin Tools**
  - Moderate users, content, and comments
  - Manage categories, tags, and sources

---

## 🛠️ Tech Stack

- **Backend**: [NestJS](https://nestjs.com/)
- **GraphQL**: Apollo Server (code-first approach)
- **ORM**: [Prisma](https://www.prisma.io/) with PostgreSQL
- **Auth**: JWT-based authentication
- **Deployment**: Docker-ready

---
## 📦 Local setup

Run these commands from `backend/`. Use Node.js 24.15 or later and Docker. Copy `.env.example` to `.env` and replace the JWT secrets before starting the API.

```sh
npm ci
docker compose up -d postgres redis mailpit
npm run db:generate
npm run db:migrate
npm run start:dev
```

The GraphQL endpoint and GraphiQL are available at `http://localhost:3000/graphql`. `npm run build` creates the production build, and `npm run start:prod` starts it.

Password recovery sends mail through SMTP. Locally, Mailpit accepts messages at `localhost:1025` and shows them at `http://localhost:8025`. Set `APP_PUBLIC_URL` to the public frontend origin so reset links point to the correct site. For deployment, set `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM`, `MAIL_USER`, `MAIL_PASSWORD`, and `MAIL_SECURE` for the SMTP provider. Do not use the local Mailpit address or example sender in production. Recovery links expire after 30 minutes and are single use. Request limits are three per email and 30 per client IP per hour, stored in Redis. The API returns the same success response for known and unknown addresses; failed delivery is logged without exposing account details, and the user can request another link later.

Prisma generates its client and types into `prisma/generated/`. Run `npm run db:generate` after changing `prisma/schema.prisma`; the generated directory is ignored by Git.

### Demo data

After applying migrations, run `npm run db:seed` from `backend/`. This explicitly runs Prisma's `prisma/seed.ts` against `DATABASE_URL`; Prisma 7 does not seed automatically during migration. The seed adds 16 published stories and two drafts across all four content types, along with sample authors, a reader, categories, tags, sources, comments, reactions, views, and a subscription. It uses stable IDs and can be run again without duplicating records or overwriting edited stories. It refuses to run when `NODE_ENV=production`.

The demo accounts are `maya.editor@content-hub.example`, `jordan.editor@content-hub.example`, and `sam.reader@content-hub.example`. By default they get random, unknown passwords. To sign in as these accounts, set `SEED_DEMO_PASSWORD` to a password of at least 12 characters and run the seed again; this updates only the demo accounts' password hashes.

Run unit tests with `npm test`. E2E tests use a separate database whose name ends in `_test`; create it and apply migrations before `npm run test:e2e`. By default, the test URL is derived from `DATABASE_URL` by appending `_test` to the database name. Set `TEST_DATABASE_URL` to use a different test database, also ending in `_test`. Never point E2E tests at a database containing data you need to keep.

```powershell
docker exec postgres_db psql -U postgres -d postgres -c "CREATE DATABASE content_hub_test"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/content_hub_test"
npm run db:migrate
Remove-Item Env:DATABASE_URL
npm run test:e2e
```

---

## 📖 API Documentation

### Modules Overview

#### CommentModule
Handles hierarchical comments with support for nested replies:
- `createComment`: Add comments to content
- `commentsByContent`: Get all comments for specific content
- `updateComment` / `deleteComment`: User can modify their own comments
- Supports parent-child relationships for threaded discussions

#### ReactionModule
Manages user reactions to content:
- `toggleReaction`: Add/remove reactions (LIKE, DISLIKE, SAVE)
- `reactionsByContent`: Get reaction analytics for content
- `reactionCounts`: Get aggregated reaction statistics
- `hasUserReacted`: Check user's reaction status

#### TagModule
Content tagging and discovery system:
- `createTag` / `updateTag` / `deleteTag`: Tag management (EDITOR/ADMIN only)
- `tags`: List all available tags
- `tagByName`: Find tags by name
- `popularTags`: Get most-used tags with content counts

#### ViewModule
Analytics and view tracking:
- `createView`: Record content views (anonymous or authenticated)
- `viewsByContent` / `myViews`: Get view history
- `viewCount` / `uniqueViewCount`: Basic analytics
- `viewStats`: Comprehensive view statistics
- `mostViewedContent`: Popular content discovery

### GraphQL Queries & Mutations

Access the GraphQL Playground at `http://localhost:3000/graphql` when running in development mode.

**Example Queries:**
```graphql
# Get comments for content
query {
  commentsByContent(contentId: "content-id") {
    id
    text
    user { username }
    replies { text }
    createdAt
  }
}

# Get reaction counts
query {
  reactionCounts(contentId: "content-id")
}

# Get popular tags
query {
  popularTags(limit: 10) {
    id
    name
    contents { title }
  }
}
```

**Example Mutations:**
```graphql
# Toggle a reaction
mutation {
  toggleReaction(data: {
    contentId: "content-id"
    type: LIKE
  })
}

# Create a comment
mutation {
  createComment(data: {
    contentId: "content-id"
    text: "Great article!"
    parentId: "parent-comment-id"  # optional for replies
  }) {
    id
    text
    createdAt
  }
}
```
