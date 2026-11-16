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
  CheckCircle2,
  ImageUp,
  ScanLine,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  confirmReturnedDevice,
  scanReturnQr,
} from "@/app/owner/rentals/actions";

type Phase =
  | "idle"
  | "starting"
  | "scanning"
  | "verifying"
  | "scanned"
  | "confirming"
  | "success"
  | "blocked";

type Props = {
  rentalId: string;
  alreadyScanned: boolean;
};

export default function ReturnQrScanner({
  rentalId,
  alreadyScanned,
}: Props) {
  const readerId =
    `return-qr-${useId().replaceAll(
      ":",
      "",
    )}`;

  const router =
    useRouter();

  const [
    phase,
    setPhase,
  ] = useState<Phase>(
    alreadyScanned
      ? "scanned"
      : "idle",
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

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

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
            if (
              starting.current
            ) {
              await starting.current;
            }

            if (
              current.isScanning
            ) {
              await current.stop();
            }

            try {
              current.clear();
            } catch {
              // Scanner may already be cleared.
            }

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
            "Could not stop return QR camera:",
            error,
          );
        },
      );
    };
  }, [stopCamera]);

  async function verifyToken(
    token: string,
  ) {
    setError("");

    setPhase(
      "verifying",
    );

    try {
      const result =
        await scanReturnQr(
          rentalId,
          token,
        );

      if (
        !mounted.current
      ) {
        return;
      }

      if (
        "error" in
        result
      ) {
        setError(
          result.error,
        );

        handled.current =
          false;

        setPhase(
          "idle",
        );

        return;
      }

      setPhase(
        "scanned",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Return QR verification failed:",
        error,
      );

      if (
        mounted.current
      ) {
        setError(
          "Could not verify the return QR code.",
        );

        handled.current =
          false;

        setPhase(
          "idle",
        );
      }
    }
  }

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
        "Could not stop return QR camera:",
        error,
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

    if (!mounted.current) {
      return;
    }

    await verifyToken(
      token,
    );
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
      await new Promise<void>(
        (resolve) => {
          requestAnimationFrame(
            () =>
              resolve(),
          );
        },
      );

      const element =
        document.getElementById(
          readerId,
        );

      if (!element) {
        throw new Error(
          "QR reader element was not found.",
        );
      }

      const {
        Html5Qrcode,
        Html5QrcodeSupportedFormats,
      } = await import(
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
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
            ],

            verbose:
              false,
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

            qrbox: {
              width: 220,
              height: 220,
            },
          },

          (token) => {
            void handleScan(
              token,
            );
          },

          () => {
            // Ignore normal frame scan errors.
          },
        );

      starting.current =
        start.then(
          () =>
            undefined,
          () =>
            undefined,
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
        "Could not start return QR camera:",
        error,
      );

      try {
        await stopCamera();
      } catch (
        stopError
      ) {
        console.error(
          "Could not clean up return QR camera:",
          stopError,
        );
      }

      if (
        mounted.current
      ) {
        const message =
          error instanceof
          Error
            ? error.message
            : "Unknown camera error.";

        setError(
          `Could not open the camera. ${message}`,
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

    setError("");

    try {
      await stopCamera();

      if (
        mounted.current
      ) {
        handled.current =
          false;

        setPhase(
          "idle",
        );
      }
    } catch (error) {
      console.error(
        "Could not stop return QR camera:",
        error,
      );

      setError(
        "Could not stop the camera.",
      );

      setPhase(
        "blocked",
      );
    }
  }

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    setPhase(
      "verifying",
    );

    try {
      await stopCamera();

      const {
        Html5Qrcode,
        Html5QrcodeSupportedFormats,
      } = await import(
        "html5-qrcode"
      );

      /*
       * Create temporary scanner for image files.
       */
      const temporaryId =
        `${readerId}-file`;

      let element =
        document.getElementById(
          temporaryId,
        );

      if (!element) {
        element =
          document.createElement(
            "div",
          );

        element.id =
          temporaryId;

        element.style.display =
          "none";

        document.body.appendChild(
          element,
        );
      }

      const imageScanner =
        new Html5Qrcode(
          temporaryId,
          {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
            ],

            verbose:
              false,
          },
        );

      const token =
        await imageScanner.scanFile(
          file,
          true,
        );

      try {
        imageScanner.clear();
      } catch {
        // nothing
      }

      element.remove();

      await verifyToken(
        token,
      );
    } catch (error) {
      console.error(
        "Return QR image scan failed:",
        error,
      );

      if (
        mounted.current
      ) {
        setError(
          "No valid return QR code was found in that image. Try another screenshot or use the camera.",
        );

        setPhase(
          "idle",
        );
      }
    } finally {
      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    }
  }

  async function confirmReturn() {
    setError("");

    setPhase(
      "confirming",
    );

    try {
      const result =
        await confirmReturnedDevice(
          rentalId,
        );

      if (
        "error" in
        result
      ) {
        setError(
          result.error,
        );

        setPhase(
          "scanned",
        );

        return;
      }

      setPhase(
        "success",
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Return confirmation failed:",
        error,
      );

      setError(
        "Could not confirm the returned device.",
      );

      setPhase(
        "scanned",
      );
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left lg:text-right">
      <p className="text-sm font-semibold text-blue-950">
        Device return
      </p>

      {phase ===
        "idle" && (
        <>
          <p className="mt-1 text-xs leading-5 text-blue-700">
            Ask the renter to display their return QR code.
            Scan it with the camera or upload a QR screenshot.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={
                startCamera
              }
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <ScanLine className="h-4 w-4" />

              Scan with camera
            </button>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <ImageUp className="h-4 w-4" />

              Upload QR image
            </button>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={
                handleImageUpload
              }
              className="hidden"
            />
          </div>
        </>
      )}

      {(phase ===
        "idle" ||
        phase ===
          "starting" ||
        phase ===
          "scanning") && (
        <div
          id={
            readerId
          }
          className="mt-3 ml-auto max-w-sm overflow-hidden rounded-xl"
        />
      )}

      {phase ===
        "starting" && (
        <p className="mt-3 text-xs text-zinc-500">
          Opening camera...
        </p>
      )}

      {phase ===
        "scanning" && (
        <button
          type="button"
          onClick={
            cancelScan
          }
          className="mt-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
        >
          Stop scanning
        </button>
      )}

      {phase ===
        "verifying" && (
        <p className="mt-3 text-xs text-zinc-500">
          Verifying return QR...
        </p>
      )}

      {phase ===
        "scanned" && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-4">
          <div className="flex items-start gap-3 lg:justify-end">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <div>
              <p className="font-semibold text-zinc-950">
                Return QR verified
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Confirm only after you physically received and inspected the device.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              confirmReturn
            }
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Confirm received in good condition
          </button>
        </div>
      )}

      {phase ===
        "confirming" && (
        <p className="mt-3 text-xs text-zinc-500">
          Confirming return and preparing settlement...
        </p>
      )}

      {phase ===
        "success" && (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          Return confirmed successfully.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}