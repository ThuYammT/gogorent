ALTER TABLE "Notification"
ADD COLUMN "rentalId" TEXT,
ADD COLUMN "type" TEXT;

CREATE INDEX "Notification_rentalId_idx" ON "Notification"("rentalId");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_rentalId_fkey"
FOREIGN KEY ("rentalId") REFERENCES "Rental"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
