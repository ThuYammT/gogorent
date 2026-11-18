-- Nullable fields preserve existing bookings while new requests collect a meeting plan.
ALTER TABLE "Rental"
  ADD COLUMN "pickupTime" TEXT,
  ADD COLUMN "pickupLocation" TEXT,
  ADD COLUMN "pickupLatitude" DOUBLE PRECISION,
  ADD COLUMN "pickupLongitude" DOUBLE PRECISION,
  ADD COLUMN "pickupInstructions" TEXT,
  ADD COLUMN "returnTime" TEXT,
  ADD COLUMN "returnLocation" TEXT,
  ADD COLUMN "returnLatitude" DOUBLE PRECISION,
  ADD COLUMN "returnLongitude" DOUBLE PRECISION,
  ADD COLUMN "returnInstructions" TEXT;
