"use client";

import {
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react";

import { useFormStatus } from "react-dom";

type NotificationActionProps = {
  variant:
    | "single"
    | "all";
};

export function NotificationActionButton({
  variant,
}: NotificationActionProps) {
  const { pending } =
    useFormStatus();

  if (
    variant === "all"
  ) {
    return (
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCheck className="h-4 w-4" />
        )}

        {pending
          ? "Updating..."
          : "Mark all as read"}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}

      {pending
        ? "Updating..."
        : "Mark read"}
    </button>
  );
}