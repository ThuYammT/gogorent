import {
  Suspense,
} from "react";

import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  ArrowLeft,
  Check,
  MapPin,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  approveListing,
  rejectListing,
} from "./actions";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatStatus(
  status: string,
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

async function ListingContent({
  params,
}: PageProps) {
  await requireAdmin();

  const { id } =
    await params;

  const device =
    await prisma.device.findUnique({
      where: {
        id,
      },

      include: {
        category:
          true,

        owner:
          true,

        images: {
          orderBy: [
            {
              isPrimary:
                "desc",
            },
            {
              createdAt:
                "asc",
            },
          ],
        },

        _count: {
          select: {
            rentals:
              true,
          },
        },
      },
    });

  if (!device) {
    notFound();
  }

  const approveAction =
    approveListing.bind(
      null,
      device.id,
    );

  const rejectAction =
    rejectListing.bind(
      null,
      device.id,
    );

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-7 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <Link
            href="/admin/listings"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to listings
          </Link>

          <div className="mt-5">
            <p className="text-sm font-medium text-zinc-500">
              Listing review
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {
                  device.name
                }
              </h1>

              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {formatStatus(
                  device.status,
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <main className="space-y-6">
            {/* IMAGES */}
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {device.images.length >
              0 ? (
                <>
                  <div className="aspect-[16/9] max-h-[520px] overflow-hidden bg-zinc-100">
                    <img
                      src={
                        device.images[0]
                          .url
                      }
                      alt={
                        device.name
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {device.images.length >
                    1 && (
                    <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-5">
                      {device.images.map(
                        (
                          image,
                        ) => (
                          <div
                            key={
                              image.id
                            }
                            className={`aspect-[4/3] overflow-hidden rounded-lg border ${
                              image.isPrimary
                                ? "border-zinc-950"
                                : "border-zinc-200"
                            }`}
                          >
                            <img
                              src={
                                image.url
                              }
                              alt={
                                device.name
                              }
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex min-h-[350px] items-center justify-center bg-zinc-50 text-8xl">
                  {device.emoji ??
                    "📦"}
                </div>
              )}
            </section>

            {/* DETAILS */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="font-semibold">
                Listing details
              </h2>

              <p className="mt-4 leading-7 text-zinc-600">
                {
                  device.description
                }
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  [
                    "Category",
                    device.category
                      .name,
                  ],
                  [
                    "Brand",
                    device.brand ??
                      "Not specified",
                  ],
                  [
                    "Model",
                    device.model ??
                      "Not specified",
                  ],
                  [
                    "Condition",
                    formatStatus(
                      device.condition,
                    ),
                  ],
                ].map(
                  ([
                    label,
                    value,
                  ]) => (
                    <div
                      key={
                        label
                      }
                      className="rounded-xl bg-zinc-50 p-4"
                    >
                      <p className="text-xs text-zinc-500">
                        {
                          label
                        }
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {
                          value
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>
            </section>
          </main>

          <aside className="space-y-5">
            {/* OWNER */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex gap-3">
                <UserRound className="h-5 w-5 text-zinc-400" />

                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">
                    Submitted by
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      device.owner
                        .name
                    }
                  </p>

                  <p className="mt-1 truncate text-sm text-zinc-500">
                    {
                      device.owner
                        .email
                    }
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <MapPin className="h-5 w-5 text-zinc-400" />

                <div>
                  <p className="text-xs text-zinc-500">
                    Device location
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {device.location ??
                      "Not specified"}
                  </p>
                </div>
              </div>
            </section>

            {/* PRICING */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">
                Pricing
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Daily rate
                  </span>

                  <b>
                    ฿
                    {Number(
                      device.pricePerDay,
                    ).toLocaleString()}
                  </b>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Deposit
                  </span>

                  <b>
                    ฿
                    {Number(
                      device.depositAmount,
                    ).toLocaleString()}
                  </b>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    Rental history
                  </span>

                  <b>
                    {
                      device._count
                        .rentals
                    }
                  </b>
                </div>
              </div>
            </section>

            {/* REVIEW */}
            {device.status ===
              "PENDING_APPROVAL" && (
              <section className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-zinc-400" />

                  <div>
                    <h2 className="text-sm font-semibold">
                      Administrator decision
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Review the information and photos before approving this listing.
                    </p>
                  </div>
                </div>

                <form
                  action={
                    approveAction
                  }
                  className="mt-5"
                >
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    <Check className="h-4 w-4" />
                    Approve listing
                  </button>
                </form>

                <div className="my-5 border-t border-zinc-100" />

                <form
                  action={
                    rejectAction
                  }
                >
                  <label
                    htmlFor="reason"
                    className="text-sm font-medium text-zinc-700"
                  >
                    Rejection reason
                  </label>

                  <textarea
                    id="reason"
                    name="reason"
                    rows={4}
                    placeholder="Explain what the owner should change..."
                    className="mt-2 w-full resize-none rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
                  />

                  <button
                    type="submit"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    Reject listing
                  </button>
                </form>
              </section>
            )}

            {device.status !==
              "PENDING_APPROVAL" && (
              <section className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="text-sm text-zinc-500">
                  This listing has already been reviewed.
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

function Loading() {
  return (
    <div className="p-10">
      <div className="h-[600px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function AdminListingPage({
  params,
}: PageProps) {
  return (
    <Suspense
      fallback={
        <Loading />
      }
    >
      <ListingContent
        params={
          params
        }
      />
    </Suspense>
  );
}