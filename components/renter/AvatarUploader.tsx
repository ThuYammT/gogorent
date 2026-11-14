"use client";

import {
  useActionState,
  useRef,
  useTransition,
} from "react";

import {
  Camera,
  Loader2,
  Trash2,
  TriangleAlert,
} from "lucide-react";

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
  const formRef =
    useRef<HTMLFormElement>(null);

  const [
    state,
    formAction,
    uploading,
  ] = useActionState(
    uploadRenterAvatar,
    initialState,
  );

  const [
    removing,
    startRemoving,
  ] = useTransition();

  const busy =
    uploading || removing;

  return (
    <div className="flex flex-col items-center">
      <form
        ref={formRef}
        action={formAction}
        className="relative"
      >
        <label
          className={`group relative block h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-sm ring-1 ring-zinc-200 ${
            busy
              ? "cursor-wait"
              : "cursor-pointer"
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
            <span className="flex h-full w-full items-center justify-center bg-amber-100 text-2xl font-bold text-amber-800">
              {initials}
            </span>
          )}

          <span
            className={`absolute inset-0 flex items-center justify-center bg-black/45 text-white transition ${
              busy
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
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
              if (
                event.target.files
                  ?.length
              ) {
                formRef.current?.requestSubmit();
              }
            }}
          />
        </label>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            formRef.current
              ?.querySelector<HTMLInputElement>(
                'input[type="file"]',
              )
              ?.click()
          }
          className="text-xs font-semibold text-amber-700 transition hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {avatarUrl
            ? "Change photo"
            : "Add photo"}
        </button>

        {avatarUrl && (
          <>
            <span className="h-3 w-px bg-zinc-200" />

            <button
              type="button"
              disabled={busy}
              onClick={() =>
                startRemoving(() =>
                  removeRenterAvatar(),
                )
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </>
        )}
      </div>

      <p className="mt-2 text-[11px] text-zinc-400">
        JPG, PNG or WebP · Max
        5 MB
      </p>

      {state.error && (
        <div className="mt-3 flex max-w-xs items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-left">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />

          <p className="text-xs font-medium leading-5 text-red-700">
            {state.error}
          </p>
        </div>
      )}
    </div>
  );
}