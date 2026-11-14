"use server";

import QRCode from "qrcode";
import { revalidatePath } from "next/cache";

import { HandoverError, initiateHandover } from "@/lib/handover";
import { requireOwner } from "@/lib/session";

export async function generateCollectionQr(rentalId: string): Promise<
  | { image: string; expiresAt: string }
  | { error: string }
> {
  await requireOwner();

  try {
    const { token, expiresAt } = await initiateHandover(rentalId, "COLLECTION");
    const image = await QRCode.toDataURL(token, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
    });

    revalidatePath("/renter/notifications");
    return { image, expiresAt: expiresAt.toISOString() };
  } catch (error) {
    if (error instanceof HandoverError) {
      return { error: error.message };
    }

    console.error(
      "Collection QR generation failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    return {
      error: "Could not display the QR code. If a code was already created, wait five minutes before trying again.",
    };
  }
}
