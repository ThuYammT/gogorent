"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

/* ======================================================
   REFRESH OWNER NOTIFICATION UI
====================================================== */

function revalidateOwnerNotifications() {
  revalidatePath(
    "/owner/notifications",
  );

  revalidatePath(
    "/owner/dashboard",
  );

  /*
   * Refreshes OwnerLayout too,
   * including the sidebar unread badge.
   */
  revalidatePath(
    "/owner",
    "layout",
  );
}

/* ======================================================
   MARK ONE AS READ
====================================================== */

export async function markNotificationRead(
  notificationId: string,
) {
  const owner =
    await requireOwner();

  const notification =
    await prisma.notification.findFirst({
      where: {
        id:
          notificationId,

        userId:
          owner.id,
      },

      select: {
        id: true,
        isRead: true,
      },
    });

  if (!notification) {
    throw new Error(
      "Notification not found.",
    );
  }

  if (!notification.isRead) {
    await prisma.notification.update({
      where: {
        id:
          notification.id,
      },

      data: {
        isRead:
          true,
      },
    });
  }

  revalidateOwnerNotifications();
}

/* ======================================================
   MARK ALL AS READ
====================================================== */

export async function markAllNotificationsRead() {
  const owner =
    await requireOwner();

  await prisma.notification.updateMany({
    where: {
      userId:
        owner.id,

      isRead:
        false,
    },

    data: {
      isRead:
        true,
    },
  });

  revalidateOwnerNotifications();
}