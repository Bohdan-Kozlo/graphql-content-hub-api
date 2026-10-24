DELETE FROM "Subscription" a USING "Subscription" b
WHERE a."userId" = b."userId" AND a."type" = b."type" AND a."targetId" = b."targetId" AND a."id" > b."id";
CREATE UNIQUE INDEX "Subscription_userId_type_targetId_key" ON "Subscription"("userId", "type", "targetId");
