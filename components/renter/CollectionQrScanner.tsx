"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { scanCollectionQr } from "@/app/renter/rentals/actions";

type Phase = "idle" | "starting" | "scanning" | "verifying" | "success" | "blocked";

export default function CollectionQrScanner({ rentalId }: { rentalId: string }) {
  const readerId = `collection-qr-${useId().replaceAll(":", "")}`;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const scanner = useRef<Html5Qrcode | null>(null);
  const starting = useRef<Promise<void> | null>(null);
  const stopping = useRef<Promise<void> | null>(null);
  const opening = useRef(false);
  const handled = useRef(false);

  const stopCamera = useCallback(async () => {
    if (stopping.current) {
      return stopping.current;
    }
    const current = scanner.current;
    if (!current) {
      return;
    }
    const operation = (async () => {
      await starting.current;
      if (current.isScanning) {
        await current.stop();
      }
      current.clear();
      if (scanner.current === current) {
        scanner.current = null;
      }
    })();
    stopping.current = operation;
    try {
      await operation;
    } finally {
      stopping.current = null;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void stopCamera().catch((error: unknown) => {
        console.error("Could not stop collection QR camera:", error instanceof Error ? error.name : "Unknown error");
      });
    };
  }, [stopCamera]);

  async function handleScan(token: string) {
    if (!mounted.current || handled.current) {
      return;
    }
    handled.current = true;
    setPhase("verifying");

    try {
      await stopCamera();
    } catch (error) {
      console.error("Could not stop collection QR camera:", error instanceof Error ? error.name : "Unknown error");
      if (mounted.current) {
        setError("Could not stop the camera. Please refresh the page.");
        setPhase("blocked");
      }
      return;
    }

    if (!mounted.current) {
      return;
    }
    try {
      const result = await scanCollectionQr(rentalId, token);
      if (!mounted.current) {
        return;
      }
      if ("error" in result) {
        setError(result.error);
        setPhase("idle");
        return;
      }
      setPhase("success");
      router.refresh();
    } catch (error) {
      console.error("Collection QR scan failed:", error instanceof Error ? error.name : "Unknown error");
      if (mounted.current) {
        setError("Could not confirm the scan result. Refresh the booking before trying again.");
        setPhase("blocked");
      }
    }
  }

  async function startCamera() {
    if (opening.current || scanner.current || stopping.current) {
      return;
    }
    opening.current = true;
    handled.current = false;
    setError("");
    setPhase("starting");

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      if (!mounted.current) {
        return;
      }
      const current = new Html5Qrcode(readerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scanner.current = current;
      const start = current.start(
        { facingMode: "environment" },
        { fps: 10 },
        (token) => { void handleScan(token); },
        undefined,
      );
      starting.current = start.then(() => undefined, () => undefined);
      await start;
      if (mounted.current && !handled.current) {
        setPhase("scanning");
      }
    } catch (error) {
      console.error("Could not start collection QR camera:", error instanceof Error ? error.name : "Unknown error");
      try {
        await stopCamera();
      } catch (stopError) {
        console.error("Could not stop collection QR camera:", stopError instanceof Error ? stopError.name : "Unknown error");
        if (mounted.current) {
          setError("Could not stop the camera. Please refresh the page.");
          setPhase("blocked");
        }
        return;
      }
      if (mounted.current) {
        setError("Could not open the camera. Allow camera access and use HTTPS or localhost, then try again.");
        setPhase("idle");
      }
    } finally {
      opening.current = false;
    }
  }

  async function cancelScan() {
    handled.current = true;
    setPhase("starting");
    try {
      await stopCamera();
      if (mounted.current) {
        setPhase("idle");
      }
    } catch (error) {
      console.error("Could not stop collection QR camera:", error instanceof Error ? error.name : "Unknown error");
      if (mounted.current) {
        setError("Could not stop the camera. Please refresh the page.");
        setPhase("blocked");
      }
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900">Collect your device</h2>
      <p className="mt-1 text-sm text-zinc-500">
        At collection, ask the owner to display the QR code and scan it with your camera.
      </p>
      <div id={readerId} className="mt-3 max-w-sm overflow-hidden rounded-xl" />
      {phase === "idle" && (
        <button
          type="button"
          onClick={startCamera}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <ScanLine className="h-4 w-4" />
          Scan collection QR
        </button>
      )}
      {phase === "starting" && <p className="mt-3 text-sm text-zinc-500">Opening or closing camera...</p>}
      {phase === "scanning" && (
        <button
          type="button"
          onClick={cancelScan}
          className="mt-3 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
        >
          Stop scanning
        </button>
      )}
      {phase === "verifying" && <p className="mt-3 text-sm text-zinc-500">Verifying QR code...</p>}
      {phase === "success" && (
        <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">
          Collection QR scanned. Collection confirmation is not yet available.
        </p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
