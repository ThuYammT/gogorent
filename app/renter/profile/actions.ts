"use server";

import { randomUUID } from "node:crypto";
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

/* ======================================================
   PROFILE PHOTO
   Stored in the existing "device-images" bucket under
   avatars/<userId>/ so no extra Supabase setup is needed.
====================================================== */

const AVATAR_BUCKET = "device-images";
const AVATAR_FOLDER = "avatars";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

// Loaded only when a photo is uploaded/removed: lib/supabase-admin throws
// if the Supabase keys are missing, and that must not break the name/phone form.
async function getStorage() {
  const { supabaseAdmin } = await import("@/lib/supabase-admin");
  return supabaseAdmin.storage.from(AVATAR_BUCKET);
}

const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type AvatarState = {
  error?: string;
};

// Only returns a path for photos inside this user's own avatar folder,
// so we never delete anything else from the bucket.
function ownAvatarPath(avatarUrl: string | null, userId: string) {
  if (!avatarUrl) {
    return null;
  }

  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const index = avatarUrl.indexOf(marker);

  if (index === -1) {
    return null;
  }

  const path = decodeURIComponent(avatarUrl.slice(index + marker.length));

  return path.startsWith(`${AVATAR_FOLDER}/${userId}/`) ? path : null;
}

async function deleteAvatarFile(path: string | null) {
  if (!path) {
    return;
  }

  const { error } = await (await getStorage()).remove([path]);

  // A leftover file is not worth failing the request over.
  if (error) {
    console.error("Could not delete old avatar:", error.message);
  }
}

async function deleteAvatarFileSafely(path: string | null) {
  try {
    await deleteAvatarFile(path);
  } catch (error) {
    console.error("Could not delete old avatar:", error);
  }
}

function refreshAvatarPages() {
  revalidatePath("/renter/profile");
  revalidatePath("/renter/dashboard");
}

export async function uploadRenterAvatar(
  _previousState: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const renter = await requireRenter();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a photo." };
  }

  const extension = AVATAR_EXTENSIONS[file.type];

  if (!extension) {
    return { error: "Photo must be a JPG, PNG or WebP image." };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { error: "Photo must be 5 MB or smaller." };
  }

  const path = `${AVATAR_FOLDER}/${renter.id}/${randomUUID()}.${extension}`;

  let storage;

  try {
    storage = await getStorage();
  } catch {
    return { error: "Photo uploads are not set up on this server yet." };
  }

  const { error: uploadError } = await storage.upload(
    path,
    await file.arrayBuffer(),
    {
      contentType: file.type,
      upsert: false,
    },
  );

  if (uploadError) {
    return { error: "Upload failed. Please try again." };
  }

  const { data } = storage.getPublicUrl(path);

  try {
    await prisma.user.update({
      where: {
        id: renter.id,
      },
      data: {
        avatarUrl: data.publicUrl,
      },
    });
  } catch (error) {
    // Don't leave an orphan file if saving the URL failed.
    await deleteAvatarFileSafely(path);
    throw error;
  }

  await deleteAvatarFileSafely(ownAvatarPath(renter.avatarUrl, renter.id));
  refreshAvatarPages();

  return {};
}

export async function removeRenterAvatar() {
  const renter = await requireRenter();

  await prisma.user.update({
    where: {
      id: renter.id,
    },
    data: {
      avatarUrl: null,
    },
  });

  await deleteAvatarFileSafely(ownAvatarPath(renter.avatarUrl, renter.id));
  refreshAvatarPages();
}
