"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

export type OwnerProfileState = {
  success?: string;
  error?: string;
};

export async function updateOwnerProfile(
  _previousState: OwnerProfileState,
  formData: FormData,
): Promise<OwnerProfileState> {
  const owner =
    await requireOwner();

  const name =
    String(
      formData.get(
        "name",
      ) ?? "",
    ).trim();

  const phone =
    String(
      formData.get(
        "phone",
      ) ?? "",
    ).trim();

  const location =
    String(
      formData.get(
        "location",
      ) ?? "",
    ).trim();

  const bio =
    String(
      formData.get(
        "bio",
      ) ?? "",
    ).trim();

  if (
    name.length < 2
  ) {
    return {
      error:
        "Your name must contain at least 2 characters.",
    };
  }

  if (
    name.length > 80
  ) {
    return {
      error:
        "Your name cannot exceed 80 characters.",
    };
  }

  if (
    phone.length > 30
  ) {
    return {
      error:
        "Phone number is too long.",
    };
  }

  if (
    location.length >
    120
  ) {
    return {
      error:
        "Location cannot exceed 120 characters.",
    };
  }

  if (
    bio.length >
    500
  ) {
    return {
      error:
        "Bio cannot exceed 500 characters.",
    };
  }

  await prisma.user.update({
    where: {
      id:
        owner.id,
    },

    data: {
      name,

      phone:
        phone || null,

      location:
        location ||
        null,

      bio:
        bio || null,
    },
  });

  /*
   * Refresh profile, dashboard header,
   * and sidebar account information.
   */
  revalidatePath(
    "/owner/profile",
  );

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/owner",
    "layout",
  );

  return {
    success:
      "Profile updated successfully.",
  };
}