ALTER TABLE "Notification" ADD COLUMN "deviceId" TEXT;

CREATE INDEX "Notification_deviceId_idx" ON "Notification"("deviceId");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_deviceId_fkey"
FOREIGN KEY ("deviceId") REFERENCES "Device"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
