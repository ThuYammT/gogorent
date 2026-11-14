"use client";

import {
  CheckCircle2,
  Loader2,
  Save,
  TriangleAlert,
} from "lucide-react";

import {
  useActionState,
  useState,
} from "react";

import {
  OwnerProfileState,
  updateOwnerProfile,
} from "@/app/owner/profile/actions";

const initialState: OwnerProfileState =
  {};

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100";

type OwnerProfileFormProps = {
  owner: {
    name: string;
    phone: string | null;
    location: string | null;
    bio: string | null;
  };
};

export default function OwnerProfileForm({
  owner,
}: OwnerProfileFormProps) {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    updateOwnerProfile,
    initialState,
  );

  const [
    bio,
    setBio,
  ] = useState(
    owner.bio ?? "",
  );

  return (
    <form
      action={
        formAction
      }
      className="space-y-6"
    >
      {/* RESULT */}
      {state.success && (
        <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Saved
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              {
                state.success
              }
            </p>
          </div>
        </div>
      )}

      {state.error && (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm font-medium text-red-700">
            {
              state.error
            }
          </p>
        </div>
      )}

      {/* PERSONAL DETAILS */}
      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-950">
            Personal information
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Information renters and GoGoRent may use to identify you.
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-zinc-700"
            >
              Display name
            </label>

            <input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              defaultValue={
                owner.name
              }
              className={
                inputClass
              }
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={30}
                defaultValue={
                  owner.phone ??
                  ""
                }
                placeholder="+66..."
                className={
                  inputClass
                }
              />

              <p className="mt-2 text-xs text-zinc-400">
                Used for contact related to rentals.
              </p>
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Location
              </label>

              <input
                id="location"
                name="location"
                maxLength={120}
                defaultValue={
                  owner.location ??
                  ""
                }
                placeholder="e.g. Bangkok"
                className={
                  inputClass
                }
              />

              <p className="mt-2 text-xs text-zinc-400">
                Helps renters understand your general pickup area.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="bio"
                className="text-sm font-medium text-zinc-700"
              >
                About you
              </label>

              <span
                className={`text-xs ${
                  bio.length >
                  450
                    ? "text-amber-600"
                    : "text-zinc-400"
                }`}
              >
                {
                  bio.length
                }{" "}
                / 500
              </span>
            </div>

            <textarea
              id="bio"
              name="bio"
              rows={6}
              maxLength={500}
              value={
                bio
              }
              onChange={(
                event,
              ) =>
                setBio(
                  event.target
                    .value,
                )
              }
              placeholder="Tell renters a little about yourself, your devices, or how you prefer to arrange pickups."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </section>

      {/* SAVE */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            pending
          }
          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}