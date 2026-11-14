"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

/*
 * Saves or un-saves a device for the logged-in renter.
 * `save` is the state the renter wants, so double clicks
 * can't flip it back by accident.
 */
export async function setFavorite(deviceId: string, save: boolean) {
  const renter = await requireRenter();

  if (save) {
    const device = await prisma.device.findUnique({
      where: {
        id: deviceId,
      },
      select: {
        id: true,
      },
    });

    if (!device) {
      throw new Error("This device no longer exists.");
    }

    await prisma.favorite.createMany({
      data: {
        userId: renter.id,
        deviceId,
      },
      skipDuplicates: true,
    });
  } else {
    await prisma.favorite.deleteMany({
      where: {
        userId: renter.id,
        deviceId,
      },
    });
  }

  revalidatePath("/renter/favorites");
  revalidatePath("/renter/dashboard");
  revalidatePath(`/devices/${deviceId}`);
}
