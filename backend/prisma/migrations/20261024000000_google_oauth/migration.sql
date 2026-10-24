ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

CREATE TABLE "ProviderIdentity" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderIdentity_provider_subject_key" ON "ProviderIdentity"("provider", "subject");
CREATE UNIQUE INDEX "ProviderIdentity_provider_userId_key" ON "ProviderIdentity"("provider", "userId");
ALTER TABLE "ProviderIdentity" ADD CONSTRAINT "ProviderIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
