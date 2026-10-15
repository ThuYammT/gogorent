"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const allowedConditions = [
  "NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
] as const;

type DeviceConditionValue =
  (typeof allowedConditions)[number];

export async function createDevice(
  formData: FormData,
) {
  /*
   * TEMPORARY:
   * Until authentication is finished, use the first
   * active OWNER account in the database.
   *
   * Later this becomes:
   * const ownerId = session.user.id
   */
  const owner = await prisma.user.findFirst({
    where: {
      role: "OWNER",
      status: "ACTIVE",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!owner) {
    throw new Error(
      "No active OWNER account exists. Create an owner account before adding a device.",
    );
  }

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const categoryId = String(
    formData.get("categoryId") ?? "",
  ).trim();

  const description = String(
    formData.get("description") ?? "",
  ).trim();

  const brand = String(
    formData.get("brand") ?? "",
  ).trim();

  const model = String(
    formData.get("model") ?? "",
  ).trim();

  const conditionValue = String(
    formData.get("condition") ?? "",
  );

  const pricePerDay = Number(
    formData.get("pricePerDay"),
  );

  const depositAmount = Number(
    formData.get("depositAmount"),
  );

  const location = String(
    formData.get("location") ?? "",
  ).trim();

  const emoji = String(
    formData.get("emoji") ?? "",
  ).trim();

  // Basic validation
  if (!name) {
    throw new Error("Device name is required.");
  }

  if (!categoryId) {
    throw new Error("Category is required.");
  }

  if (!description) {
    throw new Error("Description is required.");
  }

  if (
    !allowedConditions.includes(
      conditionValue as DeviceConditionValue,
    )
  ) {
    throw new Error("Invalid device condition.");
  }

  if (
    Number.isNaN(pricePerDay) ||
    pricePerDay <= 0
  ) {
    throw new Error(
      "Price per day must be greater than 0.",
    );
  }

  if (
    Number.isNaN(depositAmount) ||
    depositAmount < 0
  ) {
    throw new Error(
      "Deposit amount cannot be negative.",
    );
  }

  // Make sure category actually exists
  const category =
    await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    throw new Error("Category does not exist.");
  }

  const device = await prisma.device.create({
    data: {
      ownerId: owner.id,
      categoryId,

      name,
      description,

      brand: brand || null,
      model: model || null,

      condition:
        conditionValue as DeviceConditionValue,

      pricePerDay,
      depositAmount,

      location: location || null,
      emoji: emoji || "📦",

      // Owner cannot directly publish publicly.
      // Admin will approve it later.
      status: "PENDING_APPROVAL",

      avgRating: 0,
    },
  });

  revalidatePath("/owner/devices");
  revalidatePath("/devices");
  revalidatePath("/");

  redirect(`/owner/devices/${device.id}`);
}