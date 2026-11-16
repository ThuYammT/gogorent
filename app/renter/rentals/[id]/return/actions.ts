"use server";

import QRCode from "qrcode";

import {
  revalidatePath,
} from "next/cache";

import {
  HandoverError,
  initiateHandover,
} from "@/lib/handover";

import {
  requireRenter,
} from "@/lib/session";

export async function generateReturnQr(
  rentalId: string,
): Promise<
  | {
      image: string;
      expiresAt: string;
    }
  | {
      error: string;
    }
> {
  await requireRenter();

  try {
    const {
      token,
      expiresAt,
    } =
      await initiateHandover(
        rentalId,
        "RETURN",
      );

    const image =
      await QRCode.toDataURL(
        token,
        {
          errorCorrectionLevel:
            "M",

          margin: 2,

          width: 280,
        },
      );

    revalidatePath(
      "/owner/notifications",
    );

    return {
      image,

      expiresAt:
        expiresAt.toISOString(),
    };
  } catch (error) {
    if (
      error instanceof
      HandoverError
    ) {
      return {
        error:
          error.message,
      };
    }

    console.error(
      "Return QR generation failed:",
      error instanceof Error
        ? error.name
        : "Unknown error",
    );

    return {
      error:
        "Could not generate the return QR code.",
    };
  }
}