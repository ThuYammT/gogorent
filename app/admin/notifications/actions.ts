"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function revalidateAdminNotifications() {
  revalidatePath("/admin/notifications");
  revalidatePath("/admin", "layout");
}

export async function markAdminNotificationRead(notificationId: string) {
  const admin = await requireAdmin();

  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: admin.id,
    },
    data: {
      isRead: true,
    },
  });

  if (result.count !== 1) {
    throw new Error("Notification not found.");
  }

  revalidateAdminNotifications();
}

export async function markAllAdminNotificationsRead() {
  const admin = await requireAdmin();

  await prisma.notification.updateMany({
    where: {
      userId: admin.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  revalidateAdminNotifications();
}
