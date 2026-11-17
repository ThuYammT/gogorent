"use server";

import QRCode from "qrcode";
import {
  revalidatePath,
} from "next/cache";

import {
  confirmReturn,
  HandoverError,
  initiateHandover,
  verifyHandover,
} from "@/lib/handover";

import {
  requireOwner,
} from "@/lib/session";

/* ======================================================
   COLLECTION QR
====================================================== */

export async function generateCollectionQr(
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
  await requireOwner();

  try {
    const {
      token,
      expiresAt,
    } =
      await initiateHandover(
        rentalId,
        "COLLECTION",
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
      "/renter/notifications",
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
      "Collection QR generation failed:",
      error instanceof Error
        ? error.name
        : "Unknown error",
    );

    return {
      error:
        "Could not display the QR code. If a code was already created, wait five minutes before trying again.",
    };
  }
}

/* ======================================================
   OWNER SCANS RETURN QR
====================================================== */

export async function scanReturnQr(
  rentalId: string,
  token: string,
): Promise<
  | {
      success: true;
    }
  | {
      error: string;
    }
> {
  await requireOwner();

  if (
    typeof rentalId !==
      "string" ||
    typeof token !==
      "string"
  ) {
    return {
      error:
        "Invalid return QR code.",
    };
  }

  try {
    await verifyHandover(
      rentalId,
      "RETURN",
      token,
    );
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
      "Return QR verification failed:",
      error instanceof Error
        ? error.name
        : "Unknown error",
    );

    return {
      error:
        "Could not verify the return QR code.",
    };
  }

  revalidatePath(
    "/owner/rentals",
  );

  revalidatePath(
    "/owner/notifications",
  );

  revalidatePath(
    `/renter/rentals/${rentalId}`,
  );

  return {
    success: true,
  };
}

/* ======================================================
   OWNER CONFIRMS RETURN
====================================================== */

export async function confirmReturnedDevice(
  rentalId: string,
): Promise<
  | {
      success: true;
    }
  | {
      error: string;
    }
> {
  await requireOwner();

  try {
    await confirmReturn(
      rentalId,
    );
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
      "Return confirmation failed:",
      error instanceof Error
        ? error.name
        : "Unknown error",
    );

    return {
      error:
        "Could not confirm the device return.",
    };
  }

  revalidatePath(
    "/owner/rentals",
  );

  revalidatePath(
    "/owner/dashboard",
  );

  revalidatePath(
    "/owner/devices",
  );

  revalidatePath(
    "/owner/earnings",
  );

  revalidatePath(
    "/owner/notifications",
  );

  revalidatePath(
    "/renter/rentals",
  );

  revalidatePath(
    `/renter/rentals/${rentalId}`,
  );

  revalidatePath(
    "/renter/notifications",
  );

  revalidatePath(
    "/admin/payouts",
  );

  revalidatePath(
    "/admin/transactions",
  );

  revalidatePath(
    "/admin/notifications",
  );

  return {
    success: true,
  };
}