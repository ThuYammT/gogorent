"use client";

import {
  Loader2,
  Trash2,
} from "lucide-react";

import { useFormStatus } from "react-dom";

import { deleteDevice } from "@/actions/devices";

function DeleteButton() {
  const { pending } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}

      {pending
        ? "Deleting..."
        : "Delete listing"}
    </button>
  );
}

export default function DeleteDeviceButton({
  deviceId,
}: {
  deviceId: string;
}) {
  const action =
    deleteDevice.bind(
      null,
      deviceId,
    );

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed =
          window.confirm(
            "Delete this listing permanently?\n\nThis action cannot be undone.",
          );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <DeleteButton />
    </form>
  );
}