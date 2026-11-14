import type { Prisma } from "@/lib/generated/prisma/client";

export type BookingNotificationEvent =
  | "REQUESTED"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

const bookingNotificationContent: Record<
  BookingNotificationEvent,
  { title: string; message: string }
> = {
  REQUESTED: {
    title: "New booking request",
    message:
      "A renter has requested to rent your device. Please review the booking request.",
  },
  ACCEPTED: {
    title: "Booking accepted",
    message:
      "Your booking has been accepted by the owner. Please review the collection details.",
  },
  REJECTED: {
    title: "Booking rejected",
    message:
      "Unfortunately, the owner has declined your booking request.",
  },
  CANCELLED: {
    title: "Booking cancelled",
    message:
      "The booking has been cancelled. Please review the booking details.",
  },
};

export async function notifyBookingEvent(
  transaction: Prisma.TransactionClient,
  userId: string,
  event: BookingNotificationEvent,
  rentalId: string,
) {
  const content = bookingNotificationContent[event];

  await transaction.notification.create({
    data: {
      userId,
      rentalId,
      type: `BOOKING_${event}`,
      ...content,
    },
  });
}
