"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

/* ======================================================
   DEVICE CONFIG
====================================================== */

const allowedConditions = [
  "NEW",
  "LIKE_NEW",
  "GOOD",
  "FAIR",
] as const;

type DeviceConditionValue =
  (typeof allowedConditions)[number];

/* ======================================================
   IMAGE CONFIG
====================================================== */

const DEVICE_IMAGE_BUCKET =
  "device-images";

const MAX_IMAGES = 5;

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/* ======================================================
   DEVICE FORM
====================================================== */

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

/* ======================================================
   CATEGORY VALIDATION
====================================================== */

async function validateCategory(
  categoryId: string,
) {
  const category =
    await prisma.category.findUnique({
      where: {
        id: categoryId,
      },

      select: {
        id: true,
      },
    });

  if (!category) {
    throw new Error(
      "Selected category does not exist.",
    );
  }
}

/* ======================================================
   IMAGE HELPERS
====================================================== */

function getImageFiles(
  formData: FormData,
) {
  const values =
    formData.getAll("images");

  return values.filter(
    (value): value is File =>
      value instanceof File &&
      value.size > 0,
  );
}

function validateImageFiles(
  files: File[],
) {
  if (files.length > MAX_IMAGES) {
    throw new Error(
      `You can upload a maximum of ${MAX_IMAGES} images.`,
    );
  }

  for (const file of files) {
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type,
      )
    ) {
      throw new Error(
        `${file.name} is not a supported image format. Please use JPG, PNG or WEBP.`,
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      throw new Error(
        `${file.name} is larger than 5 MB.`,
      );
    }
  }
}

/*
 * Extracts:
 *
 * deviceId/random-file-name.jpg
 *
 * from:
 *
 * https://project.supabase.co/storage/v1/object/public/
 * device-images/deviceId/random-file-name.jpg
 */
function storagePathFromPublicUrl(
  url: string,
) {
  const marker =
    `/storage/v1/object/public/${DEVICE_IMAGE_BUCKET}/`;

  const markerIndex =
    url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const pathWithQuery =
    url.slice(
      markerIndex +
        marker.length,
    );

  const path =
    pathWithQuery.split("?")[0];

  try {
    return decodeURIComponent(
      path,
    );
  } catch {
    return path;
  }
}

async function removeStorageFiles(
  paths: string[],
) {
  if (paths.length === 0) {
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
      `Failed to remove image from storage: ${error.message}`,
    );
  }
}

/* ======================================================
   IMAGE UPLOAD
====================================================== */

async function uploadDeviceImages(
  deviceId: string,
  files: File[],
  existingImageCount: number,
) {
  if (files.length === 0) {
    return;
  }

  validateImageFiles(files);

  if (
    existingImageCount +
      files.length >
    MAX_IMAGES
  ) {
    throw new Error(
      `A device can have a maximum of ${MAX_IMAGES} images.`,
    );
  }

  const uploadedPaths: string[] =
    [];

  try {
    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const file =
        files[index];

      const extensionFromName =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase();

      let extension =
        extensionFromName ||
        "jpg";

      /*
       * Keep extension predictable.
       */
      if (
        file.type ===
        "image/jpeg"
      ) {
        extension = "jpg";
      }

      if (
        file.type ===
        "image/png"
      ) {
        extension = "png";
      }

      if (
        file.type ===
        "image/webp"
      ) {
        extension = "webp";
      }

      const fileName =
        `${randomUUID()}.${extension}`;

      const storagePath =
        `${deviceId}/${fileName}`;

      const arrayBuffer =
        await file.arrayBuffer();

      const {
        error: uploadError,
      } =
        await supabaseAdmin.storage
          .from(
            DEVICE_IMAGE_BUCKET,
          )
          .upload(
            storagePath,
            arrayBuffer,
            {
              contentType:
                file.type,

              cacheControl:
                "3600",

              upsert: false,
            },
          );

      if (uploadError) {
        throw new Error(
          `Failed to upload ${file.name}: ${uploadError.message}`,
        );
      }

      uploadedPaths.push(
        storagePath,
      );

      const {
        data: publicUrlData,
      } =
        supabaseAdmin.storage
          .from(
            DEVICE_IMAGE_BUCKET,
          )
          .getPublicUrl(
            storagePath,
          );

      await prisma.deviceImage.create({
        data: {
          deviceId,

          url:
            publicUrlData.publicUrl,

          /*
           * First image ever uploaded
           * becomes the cover image.
           */
          isPrimary:
            existingImageCount ===
              0 &&
            index === 0,
        },
      });
    }
  } catch (error) {
    /*
     * If something fails midway,
     * remove newly uploaded files
     * so Storage does not collect
     * unused files.
     */
    if (
      uploadedPaths.length > 0
    ) {
      await supabaseAdmin.storage
        .from(
          DEVICE_IMAGE_BUCKET,
        )
        .remove(
          uploadedPaths,
        );
    }

    /*
     * Remove any database image
     * records created during this
     * upload attempt.
     */
    await prisma.deviceImage.deleteMany({
      where: {
        deviceId,

        url: {
          in:
            uploadedPaths.map(
              (path) =>
                supabaseAdmin.storage
                  .from(
                    DEVICE_IMAGE_BUCKET,
                  )
                  .getPublicUrl(
                    path,
                  ).data
                  .publicUrl,
            ),
        },
      },
    });

    throw error;
  }
}

/* ======================================================
   CREATE DEVICE
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

  const imageFiles =
    getImageFiles(
      formData,
    );

  validateImageFiles(
    imageFiles,
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
          data.location ||
          null,

        emoji:
          data.emoji ||
          "📦",

        /*
         * Owner listings require
         * administrator approval.
         */
        status:
          "PENDING_APPROVAL",

        avgRating: 0,
      },
    });

  try {
    await uploadDeviceImages(
      device.id,
      imageFiles,
      0,
    );
  } catch (error) {
    /*
     * Creating a device with failed
     * image upload should not leave
     * an empty listing behind.
     */
    await prisma.device.delete({
      where: {
        id: device.id,
      },
    });

    throw error;
  }

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
   UPDATE DEVICE
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
        images: true,
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
    readDeviceForm(
      formData,
    );

  const imageFiles =
    getImageFiles(
      formData,
    );

  validateImageFiles(
    imageFiles,
  );

  if (
    existingDevice.images
      .length +
      imageFiles.length >
    MAX_IMAGES
  ) {
    throw new Error(
      `A device can have a maximum of ${MAX_IMAGES} images.`,
    );
  }

  await validateCategory(
    data.categoryId,
  );

  /*
   * Upload new images first.
   *
   * Existing images remain untouched.
   */
  await uploadDeviceImages(
    deviceId,
    imageFiles,
    existingDevice.images
      .length,
  );

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
        data.location ||
        null,

      emoji:
        data.emoji ||
        "📦",

      /*
       * Editing an approved listing
       * sends it back to admin review.
       */
      status:
        "PENDING_APPROVAL",
    },
  });

  revalidatePath(
    `/owner/devices/${deviceId}`,
  );

  revalidatePath(
    `/owner/devices/${deviceId}/edit`,
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
   DELETE INDIVIDUAL DEVICE IMAGE
====================================================== */

export async function deleteDeviceImage(
  imageId: string,
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
        device: {
          include: {
            images: {
              orderBy: {
                createdAt:
                  "asc",
              },
            },
          },
        },
      },
    });

  if (!image) {
    throw new Error(
      "Image not found or you do not own this listing.",
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

  const storagePath =
    storagePathFromPublicUrl(
      image.url,
    );

  if (storagePath) {
    await removeStorageFiles([
      storagePath,
    ]);
  }

  const wasPrimary =
    image.isPrimary;

  await prisma.deviceImage.delete({
    where: {
      id:
        image.id,
    },
  });

  /*
   * If the cover image was deleted,
   * promote the oldest remaining
   * image to cover.
   */
  if (wasPrimary) {
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

  /*
   * Image changes should also
   * trigger review again.
   */
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

  revalidatePath(
    `/owner/devices/${image.deviceId}`,
  );

  revalidatePath(
    `/owner/devices/${image.deviceId}/edit`,
  );

  revalidatePath(
    "/owner/devices",
  );

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/devices",
  );

  revalidatePath("/");
}

/* ======================================================
   SET PRIMARY / COVER IMAGE
====================================================== */

export async function setPrimaryDeviceImage(
  imageId: string,
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
        device: true,
      },
    });

  if (!image) {
    throw new Error(
      "Image not found or you do not own this listing.",
    );
  }

  if (
    image.device.status ===
    "RENTED"
  ) {
    throw new Error(
      "The cover image cannot be changed while the device is rented.",
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

  revalidatePath(
    `/owner/devices/${image.deviceId}`,
  );

  revalidatePath(
    `/owner/devices/${image.deviceId}/edit`,
  );

  revalidatePath(
    "/owner/devices",
  );

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/devices",
  );

  revalidatePath("/");
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
        images: true,

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

  /*
   * Preserve rental history.
   */
  if (
    device._count.rentals >
    0
  ) {
    throw new Error(
      "This device cannot be deleted because it has rental history.",
    );
  }

  /*
   * Remove physical Storage
   * objects first.
   */
  const storagePaths =
    device.images
      .map((image) =>
        storagePathFromPublicUrl(
          image.url,
        ),
      )
      .filter(
        (
          path,
        ): path is string =>
          Boolean(path),
      );

  if (
    storagePaths.length >
    0
  ) {
    await removeStorageFiles(
      storagePaths,
    );
  }

  /*
   * DeviceImage rows are removed
   * automatically because your
   * Prisma relation uses:
   *
   * onDelete: Cascade
   */
  await prisma.device.delete({
    where: {
      id:
        deviceId,
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