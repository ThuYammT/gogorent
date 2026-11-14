"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

export async function markRenterNotificationRead(
  notificationId: string,
) {
  const renter = await requireRenter();

  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: renter.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  if (result.count === 0) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: renter.id,
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      throw new Error("Notification not found.");
    }
  }

  revalidatePath("/renter/notifications");
}

export async function markAllRenterNotificationsRead() {
  const renter = await requireRenter();

  await prisma.notification.updateMany({
    where: {
      userId: renter.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/renter/notifications");
}
