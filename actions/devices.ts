"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

const allowedConditions = [
  "NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
] as const;

type DeviceConditionValue =
  (typeof allowedConditions)[number];

function readDeviceForm(
  formData: FormData,
) {
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

  if (!name) {
    throw new Error(
      "Device name is required.",
    );
  }

  if (!categoryId) {
    throw new Error(
      "Category is required.",
    );
  }

  if (!description) {
    throw new Error(
      "Description is required.",
    );
  }

  if (
    !allowedConditions.includes(
      conditionValue as DeviceConditionValue,
    )
  ) {
    throw new Error(
      "Invalid device condition.",
    );
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
      "Security deposit cannot be negative.",
    );
  }

  return {
    name,
    categoryId,
    description,
    brand,
    model,

    condition:
      conditionValue as DeviceConditionValue,

    pricePerDay,
    depositAmount,
    location,
    emoji,
  };
}

async function validateCategory(
  categoryId: string,
) {
  const category =
    await prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    throw new Error(
      "Selected category does not exist.",
    );
  }
}

/* ======================================================
   CREATE
====================================================== */

export async function createDevice(
  formData: FormData,
) {
  const owner = await requireOwner();

  const data =
    readDeviceForm(formData);

  await validateCategory(
    data.categoryId,
  );

  const device =
    await prisma.device.create({
      data: {
        ownerId: owner.id,

        categoryId:
          data.categoryId,

        name: data.name,

        description:
          data.description,

        brand:
          data.brand || null,

        model:
          data.model || null,

        condition:
          data.condition,

        pricePerDay:
          data.pricePerDay,

        depositAmount:
          data.depositAmount,

        location:
          data.location || null,

        emoji:
          data.emoji || "📦",

        status:
          "PENDING_APPROVAL",

        avgRating: 0,
      },
    });

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/owner/devices",
  );

  revalidatePath(
    "/devices",
  );

  revalidatePath("/");

  redirect(
    `/owner/devices/${device.id}`,
  );
}

/* ======================================================
   UPDATE
====================================================== */

export async function updateDevice(
  deviceId: string,
  formData: FormData,
) {
  const owner = await requireOwner();

  const existingDevice =
    await prisma.device.findFirst({
      where: {
        id: deviceId,

        ownerId: owner.id,
      },
    });

  if (!existingDevice) {
    throw new Error(
      "Device not found or you do not own this listing.",
    );
  }

  if (
    existingDevice.status ===
    "RENTED"
  ) {
    throw new Error(
      "A rented device cannot be edited.",
    );
  }

  const data =
    readDeviceForm(formData);

  await validateCategory(
    data.categoryId,
  );

  await prisma.device.update({
    where: {
      id: deviceId,
    },

    data: {
      categoryId:
        data.categoryId,

      name:
        data.name,

      description:
        data.description,

      brand:
        data.brand || null,

      model:
        data.model || null,

      condition:
        data.condition,

      pricePerDay:
        data.pricePerDay,

      depositAmount:
        data.depositAmount,

      location:
        data.location || null,

      emoji:
        data.emoji || "📦",

      /*
       * Any edited listing must
       * return to admin review.
       */
      status:
        "PENDING_APPROVAL",
    },
  });

  revalidatePath(
    `/owner/devices/${deviceId}`,
  );

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/owner/devices",
  );

  revalidatePath(
    "/devices",
  );

  revalidatePath("/");

  redirect(
    `/owner/devices/${deviceId}`,
  );
}

/* ======================================================
   DELETE
====================================================== */

export async function deleteDevice(
  deviceId: string,
) {
  const owner = await requireOwner();

  const device =
    await prisma.device.findFirst({
      where: {
        id: deviceId,

        ownerId: owner.id,
      },

      include: {
        _count: {
          select: {
            rentals: true,
          },
        },
      },
    });

  if (!device) {
    throw new Error(
      "Device not found or you do not own this listing.",
    );
  }

  if (
    device.status === "RENTED"
  ) {
    throw new Error(
      "A rented device cannot be deleted.",
    );
  }

  /*
   * Keep historical rental records intact.
   */
  if (
    device._count.rentals > 0
  ) {
    throw new Error(
      "This device cannot be deleted because it has rental history.",
    );
  }

  await prisma.device.delete({
    where: {
      id: deviceId,
    },
  });

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/owner/devices",
  );

  revalidatePath(
    "/devices",
  );

  revalidatePath("/");

  redirect(
    "/owner/devices",
  );
}