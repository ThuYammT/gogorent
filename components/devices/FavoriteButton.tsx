"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";

import { setFavorite } from "@/app/renter/favorites/actions";

type FavoriteButtonProps = {
  deviceId: string;
  initialSaved: boolean;
  // "renter" can save, "guest" is sent to login, "hidden" shows nothing
  // (owners and admins don't rent).
  viewer: "renter" | "guest" | "hidden";
  className?: string;
};

const baseClass =
  "flex items-center justify-center rounded-full bg-white p-4 shadow-sm transition hover:bg-yellow-50";

export default function FavoriteButton({
  deviceId,
  initialSaved,
  viewer,
  className = "",
}: FavoriteButtonProps) {
  const [saved, setSavedOptimistic] = useOptimistic(initialSaved);
  const [pending, startTransition] = useTransition();

  if (viewer === "hidden") {
    return null;
  }

  if (viewer === "guest") {
    return (
      <Link
        href="/login"
        className={`${baseClass} ${className}`}
        aria-label="Log in to save this device"
        title="Log in to save this device"
      >
        <Heart className="text-zinc-700" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setSavedOptimistic(!saved);
          await setFavorite(deviceId, !saved);
        })
      }
      className={`${baseClass} ${className}`}
      aria-label={saved ? "Remove from saved devices" : "Save this device"}
      aria-pressed={saved}
      title={saved ? "Remove from saved" : "Save for later"}
    >
      <Heart
        className={
          saved ? "fill-red-500 text-red-500" : "text-zinc-700"
        }
      />
    </button>
  );
}
