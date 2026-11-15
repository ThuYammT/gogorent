CREATE TYPE "CollectionIssueCategory" AS ENUM ('POWER', 'FUNCTIONALITY', 'PHYSICAL_DAMAGE', 'MISSING_ACCESSORY', 'OTHER');
CREATE TYPE "CollectionIssueStatus" AS ENUM ('OPEN', 'PROPOSED', 'RESOLVED');
CREATE TYPE "CollectionIssueOutcome" AS ENUM ('REPLACE', 'REPAIR', 'CANCEL');

CREATE TABLE "CollectionIssue" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "category" "CollectionIssueCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CollectionIssueStatus" NOT NULL DEFAULT 'OPEN',
    "proposedOutcome" "CollectionIssueOutcome",
    "replacementDeviceId" TEXT,
    "proposedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "paymentReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CollectionIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CollectionIssueEvidence" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionIssueEvidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CollectionIssue_rentalId_status_idx" ON "CollectionIssue"("rentalId", "status");
CREATE UNIQUE INDEX "CollectionIssue_one_open_per_rental" ON "CollectionIssue"("rentalId") WHERE "status" IN ('OPEN', 'PROPOSED');
CREATE UNIQUE INDEX "CollectionIssueEvidence_path_key" ON "CollectionIssueEvidence"("path");
CREATE INDEX "CollectionIssueEvidence_issueId_idx" ON "CollectionIssueEvidence"("issueId");

ALTER TABLE "CollectionIssue" ADD CONSTRAINT "CollectionIssue_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionIssue" ADD CONSTRAINT "CollectionIssue_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CollectionIssue" ADD CONSTRAINT "CollectionIssue_replacementDeviceId_fkey" FOREIGN KEY ("replacementDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CollectionIssueEvidence" ADD CONSTRAINT "CollectionIssueEvidence_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CollectionIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
