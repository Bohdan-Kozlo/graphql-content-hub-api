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
## 📦 Installation

# Clone the repo
git clone https://github.com/yourusername/graphql-content-hub-api.git
cd graphql-content-hub-api

# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Run Prisma migrations
npx prisma migrate dev

# Start the server
npm run start:dev

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




