"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const deviceIdSchema = z.string().min(1);

async function updatePendingDevice(formData: FormData, status: "AVAILABLE" | "REJECTED") {
  await requireAdmin();

  const parsedDeviceId = deviceIdSchema.safeParse(formData.get("deviceId"));
  if (!parsedDeviceId.success) {
    throw new Error("Invalid device ID");
  }

  const deviceId = parsedDeviceId.data;
  const result = await prisma.device.updateMany({
    where: {
      id: deviceId,
      status: "PENDING_APPROVAL",
    },
    data: { status },
  });

  if (result.count === 0) {
    redirect("/admin/dashboard");
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${deviceId}`);
  redirect("/admin/dashboard");
}

export async function approveDevice(formData: FormData) {
  await updatePendingDevice(formData, "AVAILABLE");
}

export async function rejectDevice(formData: FormData) {
  await updatePendingDevice(formData, "REJECTED");
}
