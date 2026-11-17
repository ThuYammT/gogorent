"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  QrCode,
} from "lucide-react";

import {
  generateReturnQr,
} from "@/app/renter/rentals/[id]/return/actions";

type Props = {
  rentalId: string;
};

type GeneratedQr = {
  image: string;
  expiresAt: string;
};

export default function ReturnQr({
  rentalId,
}: Props) {
  const [
    qr,
    setQr,
  ] =
    useState<GeneratedQr | null>(
      null,
    );

  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(0);

  const [
    pending,
    setPending,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!qr) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          const remaining =
            Math.max(
              0,

              Math.ceil(
                (new Date(
                  qr.expiresAt,
                ).getTime() -
                  Date.now()) /
                  1000,
              ),
            );

          setRemainingSeconds(
            remaining,
          );

          if (
            remaining === 0
          ) {
            setQr(null);
          }
        },
        1000,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, [qr]);

  async function generate() {
    setPending(true);
    setError("");

    try {
      const result =
        await generateReturnQr(
          rentalId,
        );

      if (
        "error" in
        result
      ) {
        setError(
          result.error,
        );

        return;
      }

      const remaining =
        Math.max(
          0,

          Math.ceil(
            (new Date(
              result.expiresAt,
            ).getTime() -
              Date.now()) /
              1000,
          ),
        );

      setRemainingSeconds(
        remaining,
      );

      setQr(result);
    } catch {
      setError(
        "Could not generate the return QR code.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
      <p className="font-semibold text-blue-950">
        Return device
      </p>

      <p className="mt-1 text-sm leading-6 text-blue-700">
        When you meet the owner to return the device, generate this QR and let the owner scan it.
      </p>

      {qr ? (
        <div className="mt-5 flex flex-col items-center rounded-xl bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              qr.image
            }
            alt="Return QR"
            className="h-52 w-52"
          />

          <p className="mt-3 text-xs font-medium text-zinc-500">
            Expires in{" "}
            {Math.floor(
              remainingSeconds /
                60,
            )}
            :
            {String(
              remainingSeconds %
                60,
            ).padStart(
              2,
              "0",
            )}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={
            generate
          }
          disabled={
            pending
          }
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <QrCode className="h-4 w-4" />

          {pending
            ? "Generating..."
            : "Generate return QR"}
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}