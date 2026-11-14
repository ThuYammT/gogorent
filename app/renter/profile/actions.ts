"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRenter } from "@/lib/session";

export type RenterProfileState = {
  success?: string;
  error?: string;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateRenterProfile(
  _previousState: RenterProfileState,
  formData: FormData,
): Promise<RenterProfileState> {
  const renter = await requireRenter();

  const name = readText(formData, "name");
  const phone = readText(formData, "phone");
  const location = readText(formData, "location");
  const bio = readText(formData, "bio");

  if (name.length < 2) {
    return { error: "Your name must contain at least 2 characters." };
  }

  if (name.length > 80) {
    return { error: "Your name cannot exceed 80 characters." };
  }

  if (phone.length > 30) {
    return { error: "Phone number is too long." };
  }

  if (location.length > 120) {
    return { error: "Location cannot exceed 120 characters." };
  }

  if (bio.length > 500) {
    return { error: "Bio cannot exceed 500 characters." };
  }

  await prisma.user.update({
    where: {
      id: renter.id,
    },
    data: {
      name,
      phone: phone || null,
      location: location || null,
      bio: bio || null,
    },
  });

  // The dashboard greeting uses the name, so refresh it too.
  revalidatePath("/renter/profile");
  revalidatePath("/renter/dashboard");

  return { success: "Profile updated successfully." };
}
