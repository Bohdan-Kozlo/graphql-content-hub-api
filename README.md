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
  - Commenting, replying, and threaded discussions
  - Reactions: like, dislike, save
  - View tracking and analytics

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




