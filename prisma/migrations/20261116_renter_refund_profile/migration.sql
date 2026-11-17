-- CreateTable
CREATE TABLE "RenterRefundProfile" (
    "id" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "promptPayId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenterRefundProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RenterRefundProfile_renterId_key" ON "RenterRefundProfile"("renterId");

-- AddForeignKey
ALTER TABLE "RenterRefundProfile" ADD CONSTRAINT "RenterRefundProfile_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
