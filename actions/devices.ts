"use server";

import {
  randomUUID,
} from "node:crypto";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { notifyAdminsOfNewListing } from "@/lib/listing-notifications";

const DEVICE_IMAGE_BUCKET =
  "device-images";

const MAX_IMAGES = 5;

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const allowedConditions = [
  "NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
] as const;

type DeviceConditionValue =
  (typeof allowedConditions)[number];

function getImageFiles(
  formData: FormData,
) {
  return formData
    .getAll("images")
    .filter(
      (value): value is File =>
        value instanceof
          File &&
        value.size > 0,
    );
}

function validateImageFiles(
  files: File[],
  existingImageCount = 0,
) {
  if (
    files.length +
      existingImageCount >
    MAX_IMAGES
  ) {
    throw new Error(
      `A listing can have a maximum of ${MAX_IMAGES} images.`,
    );
  }

  for (const file of files) {
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as
          (typeof ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      throw new Error(
        `"${file.name}" is not supported. Please use JPG, PNG or WebP.`,
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      throw new Error(
        `"${file.name}" is larger than 5 MB.`,
      );
    }
  }
}

function readDeviceForm(
  formData: FormData,
) {
  const name =
    String(
      formData.get(
        "name",
      ) ?? "",
    ).trim();

  const categoryId =
    String(
      formData.get(
        "categoryId",
      ) ?? "",
    ).trim();

  const description =
    String(
      formData.get(
        "description",
      ) ?? "",
    ).trim();

  const brand =
    String(
      formData.get(
        "brand",
      ) ?? "",
    ).trim();

  const model =
    String(
      formData.get(
        "model",
      ) ?? "",
    ).trim();

  const conditionValue =
    String(
      formData.get(
        "condition",
      ) ?? "",
    );

  const pricePerDay =
    Number(
      formData.get(
        "pricePerDay",
      ),
    );

  const depositAmount =
    Number(
      formData.get(
        "depositAmount",
      ),
    );

  const location =
    String(
      formData.get(
        "location",
      ) ?? "",
    ).trim();

  const latitudeRaw =
    String(
      formData.get(
        "latitude",
      ) ?? "",
    ).trim();

  const longitudeRaw =
    String(
      formData.get(
        "longitude",
      ) ?? "",
    ).trim();

  const emoji =
    String(
      formData.get(
        "emoji",
      ) ?? "",
    ).trim();

  const latitude =
    latitudeRaw
      ? Number(latitudeRaw)
      : null;

  const longitude =
    longitudeRaw
      ? Number(longitudeRaw)
      : null;

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
    !Number.isFinite(
      pricePerDay,
    ) ||
    pricePerDay <= 0
  ) {
    throw new Error(
      "Price per day must be greater than 0.",
    );
  }

  if (
    !Number.isFinite(
      depositAmount,
    ) ||
    depositAmount < 0
  ) {
    throw new Error(
      "Security deposit cannot be negative.",
    );
  }

  /*
   * MAP LOCATION REQUIRED
   */
  if (
    !location ||
    latitude === null ||
    longitude === null
  ) {
    throw new Error(
      "Please choose a pickup location on the map.",
    );
  }

  if (
    !Number.isFinite(
      latitude,
    ) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "Invalid latitude.",
    );
  }

  if (
    !Number.isFinite(
      longitude,
    ) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "Invalid longitude.",
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
    latitude,
    longitude,

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

function storagePathFromPublicUrl(
  publicUrl: string,
) {
  const marker =
    `/storage/v1/object/public/${DEVICE_IMAGE_BUCKET}/`;

  const markerIndex =
    publicUrl.indexOf(
      marker,
    );

  if (
    markerIndex === -1
  ) {
    return null;
  }

  return decodeURIComponent(
    publicUrl.slice(
      markerIndex +
        marker.length,
    ),
  );
}

async function removeStorageFiles(
  urls: string[],
) {
  const paths =
    urls
      .map(
        storagePathFromPublicUrl,
      )
      .filter(
        (
          path,
        ): path is string =>
          Boolean(path),
      );

  if (
    paths.length === 0
  ) {
    return;
  }

  const {
    error,
  } =
    await supabaseAdmin.storage
      .from(
        DEVICE_IMAGE_BUCKET,
      )
      .remove(paths);

  if (error) {
    throw new Error(
      `Unable to remove device images: ${error.message}`,
    );
  }
}

function extensionForFile(
  file: File,
) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return "jpg";
  }
}

async function uploadDeviceImages(
  deviceId: string,
  files: File[],
  existingImageCount: number,
) {
  const uploadedPaths:
    string[] = [];

  const createdImageIds:
    string[] = [];

  try {
    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const file =
        files[index];

      const extension =
        extensionForFile(
          file,
        );

      const path =
        `${deviceId}/${randomUUID()}.${extension}`;

      const buffer =
        await file.arrayBuffer();

      const {
        error:
          uploadError,
      } =
        await supabaseAdmin.storage
          .from(
            DEVICE_IMAGE_BUCKET,
          )
          .upload(
            path,
            buffer,
            {
              contentType:
                file.type,

              upsert:
                false,
            },
          );

      if (
        uploadError
      ) {
        throw new Error(
          uploadError.message,
        );
      }

      uploadedPaths.push(
        path,
      );

      const {
        data:
          publicUrlData,
      } =
        supabaseAdmin.storage
          .from(
            DEVICE_IMAGE_BUCKET,
          )
          .getPublicUrl(
            path,
          );

      const image =
        await prisma.deviceImage.create({
          data: {
            deviceId,

            url:
              publicUrlData
                .publicUrl,

            isPrimary:
              existingImageCount ===
                0 &&
              index === 0,
          },
        });

      createdImageIds.push(
        image.id,
      );
    }
  } catch (error) {
    if (
      createdImageIds.length >
      0
    ) {
      await prisma.deviceImage.deleteMany({
        where: {
          id: {
            in:
              createdImageIds,
          },
        },
      });
    }

    if (
      uploadedPaths.length >
      0
    ) {
      await supabaseAdmin.storage
        .from(
          DEVICE_IMAGE_BUCKET,
        )
        .remove(
          uploadedPaths,
        );
    }

    throw error;
  }
}

function revalidateDevicePages(
  deviceId?: string,
) {
  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/owner/devices",
  );

  revalidatePath(
    "/admin/dashboard",
  );

  revalidatePath(
    "/admin/listings",
  );

  revalidatePath(
    "/devices",
  );

  revalidatePath("/");

  if (deviceId) {
    revalidatePath(
      `/owner/devices/${deviceId}`,
    );

    revalidatePath(
      `/owner/devices/${deviceId}/edit`,
    );

    revalidatePath(
      `/admin/listings/${deviceId}`,
    );

    revalidatePath(
      `/devices/${deviceId}`,
    );
  }
}

/* ======================================================
   CREATE
====================================================== */

export async function createDevice(
  formData: FormData,
) {
  const owner =
    await requireOwner();

  const data =
    readDeviceForm(
      formData,
    );

  const files =
    getImageFiles(
      formData,
    );

  validateImageFiles(
    files,
  );

  await validateCategory(
    data.categoryId,
  );

  const device =
    await prisma.device.create({
      data: {
        ownerId:
          owner.id,

        categoryId:
          data.categoryId,

        name:
          data.name,

        description:
          data.description,

        brand:
          data.brand ||
          null,

        model:
          data.model ||
          null,

        condition:
          data.condition,

        pricePerDay:
          data.pricePerDay,

        depositAmount:
          data.depositAmount,

        location:
          data.location,

        latitude:
          data.latitude,

        longitude:
          data.longitude,

        emoji:
          data.emoji ||
          "📦",

        status:
          "PENDING_APPROVAL",

        avgRating:
          0,
      },
    });

  try {
    await uploadDeviceImages(
      device.id,
      files,
      0,
    );

    await prisma.$transaction(async (transaction) => {
      await notifyAdminsOfNewListing(transaction, device);
    });
  } catch (error) {
    // Roll back the listing and any uploaded images if submission fails.
    const images = await prisma.deviceImage.findMany({
      where: { deviceId: device.id },
      select: { url: true },
    });

    const paths = images
      .map((image) => storagePathFromPublicUrl(image.url))
      .filter((path): path is string => path !== null);

    await removeStorageFiles(paths);

    await prisma.device.delete({
      where: {
        id:
          device.id,
      },
    });

    throw error;
  }

  revalidateDevicePages(
    device.id,
  );

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/notifications");

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
  const owner =
    await requireOwner();

  const existingDevice =
    await prisma.device.findFirst({
      where: {
        id:
          deviceId,

        ownerId:
          owner.id,
      },

      include: {
        _count: {
          select: {
            images:
              true,
          },
        },
      },
    });

  if (
    !existingDevice
  ) {
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
    readDeviceForm(
      formData,
    );

  const files =
    getImageFiles(
      formData,
    );

  validateImageFiles(
    files,
    existingDevice
      ._count
      .images,
  );

  await validateCategory(
    data.categoryId,
  );

  if (
    files.length > 0
  ) {
    await uploadDeviceImages(
      deviceId,
      files,
      existingDevice
        ._count
        .images,
    );
  }

  await prisma.device.update({
    where: {
      id:
        deviceId,
    },

    data: {
      categoryId:
        data.categoryId,

      name:
        data.name,

      description:
        data.description,

      brand:
        data.brand ||
        null,

      model:
        data.model ||
        null,

      condition:
        data.condition,

      pricePerDay:
        data.pricePerDay,

      depositAmount:
        data.depositAmount,

      location:
        data.location,

      latitude:
        data.latitude,

      longitude:
        data.longitude,

      emoji:
        data.emoji ||
        "📦",

      /*
       * Any owner edit goes
       * back through admin review.
       */
      status:
        "PENDING_APPROVAL",
    },
  });

  revalidateDevicePages(
    deviceId,
  );

  redirect(
    `/owner/devices/${deviceId}`,
  );
}

/* ======================================================
   DELETE IMAGE
====================================================== */

export async function deleteDeviceImage(
  imageId: string,
  _formData?: FormData,
) {
  const owner =
    await requireOwner();

  const image =
    await prisma.deviceImage.findFirst({
      where: {
        id:
          imageId,

        device: {
          ownerId:
            owner.id,
        },
      },

      include: {
        device:
          true,
      },
    });

  if (!image) {
    throw new Error(
      "Image not found.",
    );
  }

  if (
    image.device.status ===
    "RENTED"
  ) {
    throw new Error(
      "Images cannot be changed while the device is rented.",
    );
  }

  await removeStorageFiles([
    image.url,
  ]);

  await prisma.deviceImage.delete({
    where: {
      id:
        image.id,
    },
  });

  if (
    image.isPrimary
  ) {
    const nextImage =
      await prisma.deviceImage.findFirst({
        where: {
          deviceId:
            image.deviceId,
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    if (nextImage) {
      await prisma.deviceImage.update({
        where: {
          id:
            nextImage.id,
        },

        data: {
          isPrimary:
            true,
        },
      });
    }
  }

  await prisma.device.update({
    where: {
      id:
        image.deviceId,
    },

    data: {
      status:
        "PENDING_APPROVAL",
    },
  });

  revalidateDevicePages(
    image.deviceId,
  );
}

/* ======================================================
   SET COVER
====================================================== */

export async function setPrimaryDeviceImage(
  imageId: string,
  _formData?: FormData,
) {
  const owner =
    await requireOwner();

  const image =
    await prisma.deviceImage.findFirst({
      where: {
        id:
          imageId,

        device: {
          ownerId:
            owner.id,
        },
      },

      include: {
        device:
          true,
      },
    });

  if (!image) {
    throw new Error(
      "Image not found.",
    );
  }

  if (
    image.device.status ===
    "RENTED"
  ) {
    throw new Error(
      "Images cannot be changed while the device is rented.",
    );
  }

  await prisma.$transaction([
    prisma.deviceImage.updateMany({
      where: {
        deviceId:
          image.deviceId,
      },

      data: {
        isPrimary:
          false,
      },
    }),

    prisma.deviceImage.update({
      where: {
        id:
          image.id,
      },

      data: {
        isPrimary:
          true,
      },
    }),

    prisma.device.update({
      where: {
        id:
          image.deviceId,
      },

      data: {
        status:
          "PENDING_APPROVAL",
      },
    }),
  ]);

  revalidateDevicePages(
    image.deviceId,
  );
}

/* ======================================================
   DELETE DEVICE
====================================================== */

export async function deleteDevice(
  deviceId: string,
) {
  const owner =
    await requireOwner();

  const device =
    await prisma.device.findFirst({
      where: {
        id:
          deviceId,

        ownerId:
          owner.id,
      },

      include: {
        images:
          true,

        _count: {
          select: {
            rentals:
              true,
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
    device.status ===
    "RENTED"
  ) {
    throw new Error(
      "A rented device cannot be deleted.",
    );
  }

  if (
    device._count.rentals >
    0
  ) {
    throw new Error(
      "This listing cannot be deleted because it has rental history.",
    );
  }

  await removeStorageFiles(
    device.images.map(
      (image) =>
        image.url,
    ),
  );

  await prisma.device.delete({
    where: {
      id:
        deviceId,
    },
  });

  revalidateDevicePages();

  redirect(
    "/owner/devices",
  );
}