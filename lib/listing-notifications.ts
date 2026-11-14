import type { Prisma } from "@/lib/generated/prisma/client";

type ListingNotificationClient = {
  user: {
    findMany(args: {
      where: { role: "ADMIN"; status: "ACTIVE" };
      select: { id: true };
    }): PromiseLike<{ id: string }[]>;
  };
  notification: {
    createMany(args: {
      data: Prisma.NotificationCreateManyInput[];
    }): PromiseLike<unknown>;
  };
};

export async function notifyAdminsOfNewListing(
  transaction: ListingNotificationClient,
  device: { id: string; name: string },
) {
  const admins = await transaction.user.findMany({
    where: {
      role: "ADMIN",
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (admins.length === 0) {
    return;
  }

  await transaction.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      deviceId: device.id,
      type: "LISTING_SUBMITTED",
      title: "New listing awaiting approval",
      message: `The listing "${device.name}" has been submitted for review.`,
    })),
  });
}
