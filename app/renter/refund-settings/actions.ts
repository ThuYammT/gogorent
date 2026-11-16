"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireRenter,
} from "@/lib/session";

export type RefundSettingsState = {
  success?: string;
  error?: string;
};

export async function saveRefundSettings(
  _previousState: RefundSettingsState,
  formData: FormData,
): Promise<RefundSettingsState> {
  const renter =
    await requireRenter();

  const method =
    String(
      formData.get("method") ?? "",
    ).trim();

  const accountName =
    String(
      formData.get("accountName") ?? "",
    ).trim();

  const bankName =
    String(
      formData.get("bankName") ?? "",
    ).trim();

  const accountNumber =
    String(
      formData.get("accountNumber") ?? "",
    ).trim();

  const promptPayId =
    String(
      formData.get("promptPayId") ?? "",
    ).trim();

  if (
    method !==
      "BANK_TRANSFER" &&
    method !==
      "PROMPTPAY"
  ) {
    return {
      error:
        "Please choose a valid refund method.",
    };
  }

  if (
    accountName.length <
    2
  ) {
    return {
      error:
        "Account holder name is required.",
    };
  }

  if (
    method ===
    "BANK_TRANSFER"
  ) {
    if (!bankName) {
      return {
        error:
          "Bank name is required.",
      };
    }

    if (!accountNumber) {
      return {
        error:
          "Bank account number is required.",
      };
    }
  }

  if (
    method ===
      "PROMPTPAY" &&
    !promptPayId
  ) {
    return {
      error:
        "PromptPay number or ID is required.",
    };
  }

  await prisma.renterRefundProfile.upsert({
    where: {
      renterId:
        renter.id,
    },

    create: {
      renterId:
        renter.id,

      method,

      accountName,

      bankName:
        method ===
        "BANK_TRANSFER"
          ? bankName
          : null,

      accountNumber:
        method ===
        "BANK_TRANSFER"
          ? accountNumber
          : null,

      promptPayId:
        method ===
        "PROMPTPAY"
          ? promptPayId
          : null,
    },

    update: {
      method,

      accountName,

      bankName:
        method ===
        "BANK_TRANSFER"
          ? bankName
          : null,

      accountNumber:
        method ===
        "BANK_TRANSFER"
          ? accountNumber
          : null,

      promptPayId:
        method ===
        "PROMPTPAY"
          ? promptPayId
          : null,
    },
  });

  revalidatePath(
    "/renter/refund-settings",
  );

  revalidatePath(
    "/admin/payouts",
  );

  return {
    success:
      "Refund details saved successfully.",
  };
}