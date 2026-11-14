-- CreateEnum
CREATE TYPE "HandoverType" AS ENUM ('COLLECTION', 'RETURN');

-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('INITIATED', 'QR_SCANNED', 'VERIFIED');

-- CreateTable
CREATE TABLE "Handover" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "type" "HandoverType" NOT NULL,
    "status" "HandoverStatus" NOT NULL DEFAULT 'INITIATED',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scannedAt" TIMESTAMP(3),
    "ownerConfirmedAt" TIMESTAMP(3),
    "renterConfirmedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Handover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverVerificationLimit" (
    "rentalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL,

    CONSTRAINT "HandoverVerificationLimit_pkey" PRIMARY KEY ("rentalId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Handover_tokenHash_key" ON "Handover"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Handover_rentalId_type_key" ON "Handover"("rentalId", "type");

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverVerificationLimit" ADD CONSTRAINT "HandoverVerificationLimit_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverVerificationLimit" ADD CONSTRAINT "HandoverVerificationLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
