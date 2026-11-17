"use client";

import {
  useState,
} from "react";

import {
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";

import {
  checkPromptPayForRental,
  createPromptPayForRental,
  type PromptPayState,
} from "@/app/renter/rentals/[id]/payment/actions";

export default function PromptPayCheckout({
  rentalId,
}: {
  rentalId: string;
}) {
  const [
    state,
    setState,
  ] =
    useState<PromptPayState | null>(
      null,
    );

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  async function createQr() {
    setBusy(true);

    try {
      setState(
        await createPromptPayForRental(
          rentalId,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus() {
    setBusy(true);

    try {
      setState(
        await checkPromptPayForRental(
          rentalId,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (
    state?.status ===
    "paid"
  ) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="h-6 w-6" />

          <div>
            <p className="font-semibold">
              Payment successful
            </p>

            <p className="mt-1 text-sm">
              Rental fee and security deposit are confirmed.
              Collection is now unlocked.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {state?.status ===
      "pending" ? (
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              state.qrUrl
            }
            alt="PromptPay QR code"
            className="mx-auto h-72 w-72 max-w-full rounded-2xl border border-zinc-200 bg-white p-3"
          />

          <p className="mt-4 text-sm font-semibold text-zinc-900">
            Scan with your Thai banking app
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            After paying, click Check payment status.
          </p>

          {state.expiresAt && (
            <p className="mt-2 text-xs text-zinc-400">
              QR expires{" "}
              {new Date(
                state.expiresAt,
              ).toLocaleString()}
            </p>
          )}

          <button
            type="button"
            onClick={
              checkStatus
            }
            disabled={
              busy
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Check payment status
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={
            createQr
          }
          disabled={
            busy
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d6efd] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b5ed7] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <QrCode className="h-4 w-4" />
          )}

          Generate PromptPay QR
        </button>
      )}

      {state?.status ===
        "failed" && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>
            {
              state.message
            }
          </p>

          <button
            type="button"
            onClick={
              createQr
            }
            disabled={
              busy
            }
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Generate a new QR
          </button>
        </div>
      )}
    </div>
  );
}