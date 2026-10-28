"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

export async function markNotificationRead(
  notificationId: string,
) {
  const owner = await requireOwner();

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: owner.id,
    },

    data: {
      isRead: true,
    },
  });

  revalidatePath(
    "/owner/notifications",
  );
}

export async function markAllNotificationsRead() {
  const owner = await requireOwner();

  await prisma.notification.updateMany({
    where: {
      userId: owner.id,
      isRead: false,
    },

    data: {
      isRead: true,
    },
  });

  revalidatePath(
    "/owner/notifications",
  );
}