import type { Prisma } from "@/lib/generated/prisma/client";
import { MeetingPlanError, readMeetingPlan, formatBookingDate } from "@/lib/booking-meetings";

export async function updateReturnMeeting(tx: Prisma.TransactionClient, rentalId: string, renterId: string, form: FormData, now = new Date()) {
  await tx.$queryRaw`SELECT "id" FROM "Rental" WHERE "id" = ${rentalId} FOR UPDATE`;
  const rental = await tx.rental.findUnique({ where: { id: rentalId } });
  if (!rental || rental.renterId !== renterId || rental.status !== "ACTIVE") throw new MeetingPlanError("Only this booking's renter can arrange a return after collection and before return confirmation.");
  const handover = await tx.handover.findUnique({ where: { rentalId_type: { rentalId, type: "RETURN" } } });
  if (handover && handover.status !== "INITIATED") throw new MeetingPlanError("The return handover is already in progress. The meeting plan can no longer be changed.");
  const plan = readMeetingPlan(form, "return", rental.endDate, now, rental.pickedUpAt);
  await tx.rental.update({ where: { id: rentalId }, data: {
    returnTime: plan.time, returnLocation: plan.location, returnLatitude: plan.latitude, returnLongitude: plan.longitude, returnInstructions: plan.instructions,
  } });
  // Any previously generated QR must not confirm a superseded meeting plan.
  await tx.handover.updateMany({ where: { rentalId, type: "RETURN", status: "INITIATED" }, data: { expiresAt: new Date(0) } });
  await tx.notification.create({ data: {
    userId: rental.ownerId, rentalId, type: "RETURN_MEETING_UPDATED", title: "Return meeting arranged",
    message: `The renter plans to return your device on ${formatBookingDate(rental.endDate)} at ${plan.time} (Bangkok time), at ${plan.location}.${plan.instructions ? ` Meeting instructions: ${plan.instructions}` : ""} Open the rental to see the map point.`,
  } });
  await tx.auditLog.create({ data: { userId: renterId, action: "RETURN_MEETING_UPDATED", entity: "Rental", entityId: rentalId, details: JSON.stringify({ date: rental.endDate.toISOString(), ...plan }) } });
}
