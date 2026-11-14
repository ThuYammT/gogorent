"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import type {
  Html5Qrcode,
} from "html5-qrcode";

import {
  Camera,
  CheckCircle2,
  Loader2,
  ScanLine,
  Square,
  TriangleAlert,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  scanCollectionQr,
} from "@/app/renter/rentals/actions";

type Phase =
  | "idle"
  | "starting"
  | "scanning"
  | "verifying"
  | "success"
  | "blocked";

export default function CollectionQrScanner({
  rentalId,
}: {
  rentalId: string;
}) {
  const readerId =
    `collection-qr-${useId().replaceAll(
      ":",
      "",
    )}`;

  const router =
    useRouter();

  const [
    phase,
    setPhase,
  ] =
    useState<Phase>(
      "idle",
    );

  const [
    error,
    setError,
  ] = useState("");

  const mounted =
    useRef(false);

  const scanner =
    useRef<Html5Qrcode | null>(
      null,
    );

  const starting =
    useRef<Promise<void> | null>(
      null,
    );

  const stopping =
    useRef<Promise<void> | null>(
      null,
    );

  const opening =
    useRef(false);

  const handled =
    useRef(false);

  const stopCamera =
    useCallback(
      async () => {
        if (
          stopping.current
        ) {
          return stopping.current;
        }

        const current =
          scanner.current;

        if (!current) {
          return;
        }

        const operation =
          (async () => {
            await starting.current;

            if (
              current.isScanning
            ) {
              await current.stop();
            }

            current.clear();

            if (
              scanner.current ===
              current
            ) {
              scanner.current =
                null;
            }
          })();

        stopping.current =
          operation;

        try {
          await operation;
        } finally {
          stopping.current =
            null;
        }
      },
      [],
    );

  useEffect(() => {
    mounted.current =
      true;

    return () => {
      mounted.current =
        false;

      void stopCamera().catch(
        (
          error: unknown,
        ) => {
          console.error(
            "Could not stop collection QR camera:",
            error instanceof
              Error
              ? error.name
              : "Unknown error",
          );
        },
      );
    };
  }, [stopCamera]);

  async function handleScan(
    token: string,
  ) {
    if (
      !mounted.current ||
      handled.current
    ) {
      return;
    }

    handled.current =
      true;

    setPhase(
      "verifying",
    );

    try {
      await stopCamera();
    } catch (error) {
      console.error(
        "Could not stop collection QR camera:",
        error instanceof Error
          ? error.name
          : "Unknown error",
      );

      if (
        mounted.current
      ) {
        setError(
          "Could not stop the camera. Please refresh the page.",
        );

        setPhase(
          "blocked",
        );
      }

      return;
    }

    if (
      !mounted.current
    ) {
      return;
    }

    try {
      const result =
        await scanCollectionQr(
          rentalId,
          token,
        );

      if (
        !mounted.current
      ) {
        return;
      }

      if (
        "error" in result
      ) {
        setError(
          result.error,
        );

        setPhase(
          "idle",
        );

        return;
      }

      setPhase(
        "success",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Collection QR scan failed:",
        error instanceof Error
          ? error.name
          : "Unknown error",
      );

      if (
        mounted.current
      ) {
        setError(
          "Could not confirm the scan result. Refresh the booking before trying again.",
        );

        setPhase(
          "blocked",
        );
      }
    }
  }

  async function startCamera() {
    if (
      opening.current ||
      scanner.current ||
      stopping.current
    ) {
      return;
    }

    opening.current =
      true;

    handled.current =
      false;

    setError("");

    setPhase(
      "starting",
    );

    try {
      const {
        Html5Qrcode,
        Html5QrcodeSupportedFormats,
      } =
        await import(
          "html5-qrcode"
        );

      if (
        !mounted.current
      ) {
        return;
      }

      const current =
        new Html5Qrcode(
          readerId,
          {
            formatsToSupport:
              [
                Html5QrcodeSupportedFormats.QR_CODE,
              ],
            verbose: false,
          },
        );

      scanner.current =
        current;

      const start =
        current.start(
          {
            facingMode:
              "environment",
          },
          {
            fps: 10,
          },
          (token) => {
            void handleScan(
              token,
            );
          },
          undefined,
        );

      starting.current =
        start.then(
          () => undefined,
          () => undefined,
        );

      await start;

      if (
        mounted.current &&
        !handled.current
      ) {
        setPhase(
          "scanning",
        );
      }
    } catch (error) {
      console.error(
        "Could not start collection QR camera:",
        error instanceof Error
          ? error.name
          : "Unknown error",
      );

      try {
        await stopCamera();
      } catch (stopError) {
        console.error(
          "Could not stop collection QR camera:",
          stopError instanceof
            Error
            ? stopError.name
            : "Unknown error",
        );

        if (
          mounted.current
        ) {
          setError(
            "Could not stop the camera. Please refresh the page.",
          );

          setPhase(
            "blocked",
          );
        }

        return;
      }

      if (
        mounted.current
      ) {
        setError(
          "Could not open the camera. Allow camera access and use HTTPS or localhost, then try again.",
        );

        setPhase(
          "idle",
        );
      }
    } finally {
      opening.current =
        false;
    }
  }

  async function cancelScan() {
    handled.current =
      true;

    setPhase(
      "starting",
    );

    try {
      await stopCamera();

      if (
        mounted.current
      ) {
        setPhase(
          "idle",
        );
      }
    } catch (error) {
      console.error(
        "Could not stop collection QR camera:",
        error instanceof Error
          ? error.name
          : "Unknown error",
      );

      if (
        mounted.current
      ) {
        setError(
          "Could not stop the camera. Please refresh the page.",
        );

        setPhase(
          "blocked",
        );
      }
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-5">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
          <ScanLine className="h-5 w-5 text-amber-600" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Scan collection QR
          </h3>

          <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
            Ask the owner to
            display the collection
            QR code, then scan it
            with your device camera.
          </p>
        </div>
      </div>

      <div
        id={readerId}
        className={`mt-5 max-w-md overflow-hidden rounded-xl bg-zinc-950 ${
          phase === "idle"
            ? "hidden"
            : ""
        }`}
      />

      {phase ===
        "idle" && (
        <button
          type="button"
          onClick={
            startCamera
          }
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          <Camera className="h-4 w-4" />
          Open camera
        </button>
      )}

      {phase ===
        "starting" && (
        <div className="mt-5 flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening or closing
          camera...
        </div>
      )}

      {phase ===
        "scanning" && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            Camera is scanning
          </div>

          <button
            type="button"
            onClick={
              cancelScan
            }
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </button>
        </div>
      )}

      {phase ===
        "verifying" && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying collection
          QR...
        </div>
      )}

      {phase ===
        "success" && (
        <div
          role="status"
          className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div>
            <p className="text-sm font-semibold text-emerald-800">
              QR verified
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              The collection QR
              was scanned
              successfully.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm leading-6 text-red-700">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}