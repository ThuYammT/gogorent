-- CreateTable
CREATE TABLE "OwnerPayoutProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "promptPayId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerPayoutProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerPayoutProfile_ownerId_key" ON "OwnerPayoutProfile"("ownerId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "OwnerPayoutProfile" ADD CONSTRAINT "OwnerPayoutProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
