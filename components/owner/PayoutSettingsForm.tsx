"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  Building2,
  CheckCircle2,
  Smartphone,
} from "lucide-react";

import {
  savePayoutSettings,
  type PayoutSettingsState,
} from "@/app/owner/payout-settings/actions";

type Props = {
  initial: {
    method: string;
    accountName: string;
    bankName: string;
    accountNumber: string;
    promptPayId: string;
  };
};

const initialState: PayoutSettingsState = {};

export default function PayoutSettingsForm({
  initial,
}: Props) {
  const [method, setMethod] = useState(
    initial.method || "BANK_TRANSFER",
  );

  const [state, action, pending] =
    useActionState(
      savePayoutSettings,
      initialState,
    );

  return (
    <form
      action={action}
      className="space-y-6"
    >
      <div>
        <p className="text-sm font-semibold text-zinc-900">
          Payout method
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              method === "BANK_TRANSFER"
                ? "border-zinc-950 bg-zinc-50"
                : "border-zinc-200"
            }`}
          >
            <input
              type="radio"
              name="method"
              value="BANK_TRANSFER"
              checked={
                method === "BANK_TRANSFER"
              }
              onChange={() =>
                setMethod("BANK_TRANSFER")
              }
              className="sr-only"
            />

            <Building2 className="h-5 w-5" />

            <p className="mt-3 font-semibold">
              Bank transfer
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Receive payout to your Thai bank account.
            </p>
          </label>

          <label
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              method === "PROMPTPAY"
                ? "border-zinc-950 bg-zinc-50"
                : "border-zinc-200"
            }`}
          >
            <input
              type="radio"
              name="method"
              value="PROMPTPAY"
              checked={
                method === "PROMPTPAY"
              }
              onChange={() =>
                setMethod("PROMPTPAY")
              }
              className="sr-only"
            />

            <Smartphone className="h-5 w-5" />

            <p className="mt-3 font-semibold">
              PromptPay
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Receive payout using your PromptPay ID.
            </p>
          </label>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-zinc-900">
          Account holder name
        </label>

        <input
          name="accountName"
          defaultValue={
            initial.accountName
          }
          placeholder="Name shown on bank account"
          className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-950"
        />
      </div>

      {method === "BANK_TRANSFER" ? (
        <>
          <div>
            <label className="text-sm font-semibold text-zinc-900">
              Bank
            </label>

            <select
              name="bankName"
              defaultValue={
                initial.bankName
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-zinc-950"
            >
              <option value="">
                Choose bank
              </option>

              <option value="Kasikornbank">
                Kasikornbank (KBank)
              </option>

              <option value="Bangkok Bank">
                Bangkok Bank
              </option>

              <option value="Krung Thai Bank">
                Krung Thai Bank
              </option>

              <option value="Siam Commercial Bank">
                Siam Commercial Bank (SCB)
              </option>

              <option value="Krungsri">
                Krungsri
              </option>

              <option value="TTB">
                TTB
              </option>

              <option value="Government Savings Bank">
                Government Savings Bank
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-zinc-900">
              Account number
            </label>

            <input
              name="accountNumber"
              defaultValue={
                initial.accountNumber
              }
              placeholder="1234567890"
              inputMode="numeric"
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-950"
            />
          </div>
        </>
      ) : (
        <div>
          <label className="text-sm font-semibold text-zinc-900">
            PromptPay number / ID
          </label>

          <input
            name="promptPayId"
            defaultValue={
              initial.promptPayId
            }
            placeholder="Phone number or PromptPay ID"
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-950"
          />

          <p className="mt-2 text-xs text-zinc-500">
            Example: 0812345678
          </p>
        </div>
      )}

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />

          {state.success}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending
          ? "Saving..."
          : "Save payout details"}
      </button>
    </form>
  );
}