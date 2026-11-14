"use client";

import { useActionState, useRef, useTransition } from "react";
import { Camera, Loader2, Trash2, TriangleAlert } from "lucide-react";

import {
  type AvatarState,
  removeRenterAvatar,
  uploadRenterAvatar,
} from "@/app/renter/profile/actions";

const initialState: AvatarState = {};

type AvatarUploaderProps = {
  avatarUrl: string | null;
  initials: string;
};

export default function AvatarUploader({
  avatarUrl,
  initials,
}: AvatarUploaderProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, uploading] = useActionState(
    uploadRenterAvatar,
    initialState,
  );
  const [removing, startRemoving] = useTransition();
  const busy = uploading || removing;

  return (
    <div className="flex flex-col items-center">
      <form ref={formRef} action={formAction} className="relative">
        <label
          className={`group relative block h-24 w-24 overflow-hidden rounded-full ${
            busy ? "cursor-wait" : "cursor-pointer"
          }`}
          title="Change photo"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Your profile photo"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-400 text-2xl font-black text-zinc-900">
              {initials}
            </span>
          )}

          <span
            className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white transition ${
              busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
          </span>

          <input
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            className="sr-only"
            aria-label="Upload profile photo"
            onChange={(event) => {
              if (event.target.files?.length) {
                formRef.current?.requestSubmit();
              }
            }}
          />
        </label>
      </form>

      <div className="mt-3 flex items-center gap-3 text-xs font-bold">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            formRef.current
              ?.querySelector<HTMLInputElement>('input[type="file"]')
              ?.click()
          }
          className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
        >
          {avatarUrl ? "Change photo" : "Add photo"}
        </button>

        {avatarUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => startRemoving(() => removeRenterAvatar())}
            className="inline-flex items-center gap-1 text-zinc-400 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>

      {state.error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <TriangleAlert className="h-3.5 w-3.5" />
          {state.error}
        </p>
      )}
    </div>
  );
}
