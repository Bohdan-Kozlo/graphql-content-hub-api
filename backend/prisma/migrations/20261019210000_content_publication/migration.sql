CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TABLE "Content"
  ADD COLUMN "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Content created before the lifecycle existed was already public.
UPDATE "Content"
SET "status" = 'PUBLISHED', "publishedAt" = "createdAt";

CREATE INDEX "Content_status_publishedAt_idx" ON "Content"("status", "publishedAt");
