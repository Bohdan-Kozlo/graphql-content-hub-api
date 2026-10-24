DELETE FROM "Reaction" WHERE "type" = 'DISLIKE';

CREATE TYPE "ReactionType_new" AS ENUM ('LIKE', 'SAVE');

ALTER TABLE "Reaction"
  ALTER COLUMN "type" TYPE "ReactionType_new"
  USING ("type"::text::"ReactionType_new");

ALTER TYPE "ReactionType" RENAME TO "ReactionType_old";
ALTER TYPE "ReactionType_new" RENAME TO "ReactionType";
DROP TYPE "ReactionType_old";
