ALTER TABLE "View" ADD COLUMN "requestId" TEXT;

UPDATE "View" SET "requestId" = 'legacy-' || "id" WHERE "requestId" IS NULL;

ALTER TABLE "View" ALTER COLUMN "requestId" SET NOT NULL;
CREATE UNIQUE INDEX "View_requestId_key" ON "View"("requestId");

CREATE TABLE "ReadingHistory" (
  "userId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReadingHistory_pkey" PRIMARY KEY ("userId", "contentId"),
  CONSTRAINT "ReadingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ReadingHistory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ReadingHistory_userId_lastViewedAt_idx" ON "ReadingHistory"("userId", "lastViewedAt");

INSERT INTO "ReadingHistory" ("userId", "contentId", "lastViewedAt")
SELECT "userId", "contentId", MAX("viewedAt")
FROM "View"
WHERE "userId" IS NOT NULL
GROUP BY "userId", "contentId";
