"use server";

import {
  revalidatePath,
} from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function approveListing(
  deviceId: string,
) {
  await requireAdmin();

  const device =
    await prisma.device.findUnique({
      where: {
        id: deviceId,
      },
    });

  if (!device) {
    throw new Error(
      "Listing not found.",
    );
  }

  if (
    device.status !==
      "PENDING_APPROVAL"
  ) {
    throw new Error(
      "Only pending listings can be approved.",
    );
  }

  await prisma.$transaction([
    prisma.device.update({
      where: {
        id:
          device.id,
      },

      data: {
        status:
          "AVAILABLE",
      },
    }),

    prisma.notification.create({
      data: {
        userId:
          device.ownerId,

        title:
          "Listing approved",

        message:
          `Your listing "${device.name}" has been approved and is now available on the marketplace.`,

        isRead:
          false,
      },
    }),
  ]);

  revalidatePath(
    `/admin/listings/${deviceId}`,
  );

  revalidatePath(
    "/admin/listings",
  );

  revalidatePath(
    "/admin/dashboard",
  );

  revalidatePath(
    "/owner/devices",
  );

  revalidatePath("/");
}

export async function rejectListing(
  deviceId: string,
  formData: FormData,
) {
  await requireAdmin();

  const reason =
    String(
      formData.get(
        "reason",
      ) ?? "",
    ).trim();

  const device =
    await prisma.device.findUnique({
      where: {
        id:
          deviceId,
      },
    });

  if (!device) {
    throw new Error(
      "Listing not found.",
    );
  }

  if (
    device.status !==
      "PENDING_APPROVAL"
  ) {
    throw new Error(
      "Only pending listings can be rejected.",
    );
  }

  await prisma.$transaction([
    prisma.device.update({
      where: {
        id:
          device.id,
      },

      data: {
        status:
          "REJECTED",
      },
    }),

    prisma.notification.create({
      data: {
        userId:
          device.ownerId,

        title:
          "Listing needs changes",

        message:
          reason
            ? `Your listing "${device.name}" was not approved. Reason: ${reason}`
            : `Your listing "${device.name}" was not approved. Please review and update the listing before submitting it again.`,

        isRead:
          false,
      },
    }),
  ]);

  revalidatePath(
    `/admin/listings/${deviceId}`,
  );

  revalidatePath(
    "/admin/listings",
  );

  revalidatePath(
    "/admin/dashboard",
  );

  revalidatePath(
    "/owner/devices",
  );
}