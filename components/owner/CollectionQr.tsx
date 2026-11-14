"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";

import { generateCollectionQr } from "@/app/owner/rentals/actions";

type CollectionQrProps = {
  rentalId: string;
};

type GeneratedQr = {
  image: string;
  expiresAt: string;
};

export default function CollectionQr({ rentalId }: CollectionQrProps) {
  const [qr, setQr] = useState<GeneratedQr | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!qr) {
      return;
    }

    const timer = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(qr.expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        setQr(null);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [qr]);

  async function generate() {
    setPending(true);
    setError("");

    try {
      const result = await generateCollectionQr(rentalId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const remaining = Math.max(
        0,
        Math.ceil((new Date(result.expiresAt).getTime() - Date.now()) / 1000),
      );
      if (remaining === 0) {
        setError("The QR code has expired. Please generate a new one.");
        return;
      }
      setRemainingSeconds(remaining);
      setQr(result);
    } catch {
      setError("Could not receive the QR code. If a code was created, wait five minutes before trying again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 text-left lg:text-right">
      {qr ? (
        <div className="inline-flex max-w-full flex-col items-center rounded-xl border border-zinc-200 bg-white p-3 text-center">
          {/* This data URL is generated locally by the server, not a remote image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr.image}
            alt="Collection QR code for the renter"
            className="h-48 w-48 max-w-full"
          />
          <p className="mt-2 text-xs font-semibold text-zinc-700">
            Expires in {Math.floor(remainingSeconds / 60)}:
            {String(remainingSeconds % 60).padStart(2, "0")}
          </p>
          <p className="mt-1 max-w-48 text-xs text-zinc-500">
            Show this code to your renter. Keep this page open until they scan it.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          <QrCode className="h-4 w-4" />
          {pending ? "Generating..." : "Generate collection QR"}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 max-w-56 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
