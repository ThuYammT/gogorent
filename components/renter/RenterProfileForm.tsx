"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  CheckCircle2,
  Loader2,
  Save,
  TriangleAlert,
} from "lucide-react";

import {
  type RenterProfileState,
  updateRenterProfile,
} from "@/app/renter/profile/actions";

const initialState: RenterProfileState =
  {};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

type RenterProfileFormProps = {
  renter: {
    name: string;
    phone: string | null;
    location: string | null;
    bio: string | null;
  };
};

export default function RenterProfileForm({
  renter,
}: RenterProfileFormProps) {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    updateRenterProfile,
    initialState,
  );

  const [
    bio,
    setBio,
  ] = useState(
    renter.bio ?? "",
  );

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      {state.success && (
        <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <p className="text-sm font-medium text-emerald-800">
            {state.success}
          </p>
        </div>
      )}

      {state.error && (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm font-medium text-red-700">
            {state.error}
          </p>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-base font-semibold text-zinc-950">
            Personal information
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Owners can use this
            information when arranging
            your rental pickup or
            return.
          </p>
        </div>

        <div className="space-y-6 p-6">
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
                renter.name
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
                Phone number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={30}
                defaultValue={
                  renter.phone ??
                  ""
                }
                placeholder="+66..."
                className={
                  inputClass
                }
              />

              <p className="mt-2 text-xs leading-5 text-zinc-400">
                Used by owners when
                coordinating pickup
                and return.
              </p>
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                General location
              </label>

              <input
                id="location"
                name="location"
                maxLength={120}
                defaultValue={
                  renter.location ??
                  ""
                }
                placeholder="e.g. Bangkok"
                className={
                  inputClass
                }
              />

              <p className="mt-2 text-xs leading-5 text-zinc-400">
                Your general area,
                not an exact address.
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
                    ? "text-amber-700"
                    : "text-zinc-400"
                }`}
              >
                {bio.length} /
                500
              </span>
            </div>

            <textarea
              id="bio"
              name="bio"
              rows={6}
              maxLength={500}
              value={bio}
              onChange={(
                event,
              ) =>
                setBio(
                  event.target
                    .value,
                )
              }
              placeholder="Tell owners a little about yourself and what you usually rent devices for."
              className={`${inputClass} resize-none leading-6`}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-100 bg-zinc-50/60 px-6 py-4">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
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
      </section>
    </form>
  );
}