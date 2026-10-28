import { Suspense } from "react";
import {
  BadgeCheck,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import { updateOwnerProfile } from "./actions";

import { requireOwner } from "@/lib/session";

async function ProfileContent() {
  const owner = await requireOwner();

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-8 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-sm font-medium text-zinc-500">
            Account settings
          </p>

          <h1 className="mt-1 text-3xl font-semibold">
            Profile
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage your public owner information.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-6 py-8 md:px-10 xl:px-12">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-950 text-xl font-semibold text-white">
              {owner.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <h2 className="mt-5 font-semibold">
              {owner.name}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {owner.email}
            </p>

            <div className="mt-5 border-t border-zinc-100 pt-5">
              <div className="flex items-center gap-2 text-sm">
                <BadgeCheck
                  className={`h-4 w-4 ${
                    owner.isVerified
                      ? "text-emerald-600"
                      : "text-zinc-400"
                  }`}
                />

                {owner.isVerified
                  ? "Verified owner"
                  : "Not verified"}
              </div>
            </div>
          </aside>

          <form
            action={updateOwnerProfile}
            className="rounded-2xl border border-zinc-200 bg-white p-6"
          >
            <h2 className="text-base font-semibold">
              Personal information
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium">
                  Name
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-lg border border-zinc-200 px-3">
                  <UserRound className="h-4 w-4 text-zinc-400" />

                  <input
                    name="name"
                    required
                    defaultValue={
                      owner.name
                    }
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Email
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3">
                  <Mail className="h-4 w-4 text-zinc-400" />

                  <input
                    value={
                      owner.email
                    }
                    disabled
                    className="w-full bg-transparent py-3 text-sm text-zinc-500 outline-none"
                  />
                </div>

                <p className="mt-1 text-xs text-zinc-400">
                  Email changes are not available here.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">
                    Phone
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-zinc-200 px-3">
                    <Phone className="h-4 w-4 text-zinc-400" />

                    <input
                      name="phone"
                      defaultValue={
                        owner.phone ??
                        ""
                      }
                      placeholder="+66..."
                      className="w-full py-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Location
                  </label>

                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-zinc-200 px-3">
                    <MapPin className="h-4 w-4 text-zinc-400" />

                    <input
                      name="location"
                      defaultValue={
                        owner.location ??
                        ""
                      }
                      placeholder="Bangkok"
                      className="w-full py-3 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Bio
                </label>

                <textarea
                  name="bio"
                  rows={5}
                  defaultValue={
                    owner.bio ?? ""
                  }
                  placeholder="Tell renters a little about yourself..."
                  className="mt-2 w-full resize-none rounded-lg border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-zinc-100 pt-6">
              <button
                type="submit"
                className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function OwnerProfilePage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}