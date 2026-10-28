"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

export async function updateOwnerProfile(
  formData: FormData,
) {
  const owner = await requireOwner();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const phone = String(
    formData.get("phone") ?? "",
  ).trim();

  const location = String(
    formData.get("location") ?? "",
  ).trim();

  const bio = String(
    formData.get("bio") ?? "",
  ).trim();

  if (!name) {
    throw new Error(
      "Name is required.",
    );
  }

  await prisma.user.update({
    where: {
      id: owner.id,
    },

    data: {
      name,

      phone:
        phone || null,

      location:
        location || null,

      bio:
        bio || null,
    },
  });

  revalidatePath(
    "/owner/profile",
  );

  revalidatePath(
    "/owner",
    "layout",
  );
}