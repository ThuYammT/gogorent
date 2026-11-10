"use server";

import {
  revalidatePath,
} from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function setUserStatus(
  userId: string,
  status:
    | "ACTIVE"
    | "SUSPENDED",
) {
  const admin =
    await requireAdmin();

  if (
    userId === admin.id
  ) {
    throw new Error(
      "You cannot change the status of your own administrator account.",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    throw new Error(
      "User not found.",
    );
  }

  /*
   * Protect administrator accounts
   * from normal user-management actions.
   */
  if (
    user.role === "ADMIN"
  ) {
    throw new Error(
      "Administrator accounts cannot be suspended from this page.",
    );
  }

  await prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      status,
    },
  });

  await prisma.notification.create({
    data: {
      userId:
        user.id,

      title:
        status ===
        "SUSPENDED"
          ? "Account suspended"
          : "Account reactivated",

      message:
        status ===
        "SUSPENDED"
          ? "Your GoGoRent account has been suspended by an administrator."
          : "Your GoGoRent account has been reactivated.",

      isRead:
        false,
    },
  });

  revalidatePath(
    "/admin/users",
  );

  revalidatePath(
    "/admin/dashboard",
  );
}