"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

export type PayoutSettingsState = {
  success?: string;
  error?: string;
};

export async function savePayoutSettings(
  _previousState: PayoutSettingsState,
  formData: FormData,
): Promise<PayoutSettingsState> {
  const owner = await requireOwner();

  const method = String(
    formData.get("method") ?? "",
  ).trim();

  const accountName = String(
    formData.get("accountName") ?? "",
  ).trim();

  const bankName = String(
    formData.get("bankName") ?? "",
  ).trim();

  const accountNumber = String(
    formData.get("accountNumber") ?? "",
  ).trim();

  const promptPayId = String(
    formData.get("promptPayId") ?? "",
  ).trim();

  if (
    method !== "BANK_TRANSFER" &&
    method !== "PROMPTPAY"
  ) {
    return {
      error: "Please choose a valid payout method.",
    };
  }

  if (accountName.length < 2) {
    return {
      error: "Account holder name is required.",
    };
  }

  if (method === "BANK_TRANSFER") {
    if (!bankName) {
      return {
        error: "Bank name is required.",
      };
    }

    if (!accountNumber) {
      return {
        error: "Bank account number is required.",
      };
    }
  }

  if (
    method === "PROMPTPAY" &&
    !promptPayId
  ) {
    return {
      error: "PromptPay number or ID is required.",
    };
  }

  await prisma.ownerPayoutProfile.upsert({
    where: {
      ownerId: owner.id,
    },

    create: {
      ownerId: owner.id,
      method,
      accountName,

      bankName:
        method === "BANK_TRANSFER"
          ? bankName
          : null,

      accountNumber:
        method === "BANK_TRANSFER"
          ? accountNumber
          : null,

      promptPayId:
        method === "PROMPTPAY"
          ? promptPayId
          : null,
    },

    update: {
      method,
      accountName,

      bankName:
        method === "BANK_TRANSFER"
          ? bankName
          : null,

      accountNumber:
        method === "BANK_TRANSFER"
          ? accountNumber
          : null,

      promptPayId:
        method === "PROMPTPAY"
          ? promptPayId
          : null,
    },
  });

  revalidatePath("/owner/payout-settings");
  revalidatePath("/owner/earnings");
  revalidatePath("/admin/payouts");

  return {
    success: "Payout details saved successfully.",
  };
}