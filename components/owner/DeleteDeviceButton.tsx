"use client";

import { Trash2 } from "lucide-react";

import { deleteDevice } from "@/actions/devices";

type DeleteDeviceButtonProps = {
  deviceId: string;
};

export default function DeleteDeviceButton({
  deviceId,
}: DeleteDeviceButtonProps) {
  const deleteAction =
    deleteDevice.bind(null, deviceId);

  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        const confirmed =
          window.confirm(
            "Are you sure you want to delete this listing? This action cannot be undone.",
          );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 font-bold text-red-600 transition hover:bg-red-100"
      >
        <Trash2 className="h-5 w-5" />
        Delete Listing
      </button>
    </form>
  );
}