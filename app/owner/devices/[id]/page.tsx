import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarClock,
  MapPin,
  Pencil,
  ShieldCheck,
  Tag,
} from "lucide-react";

import DeleteDeviceButton from "@/components/owner/DeleteDeviceButton";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

type OwnerDevicePageProps = {
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
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
}

function formatCondition(
  condition: string,
) {
  return condition
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
}

function statusStyle(
  status: string,
) {
  switch (status) {
    case "AVAILABLE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "PENDING_APPROVAL":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "RENTED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-600";
  }
}

async function OwnerDeviceContent({
  params,
}: OwnerDevicePageProps) {
  const { id } =
    await params;

  const owner =
    await requireOwner();

  const device =
    await prisma.device.findFirst({
      where: {
        id,
        ownerId:
          owner.id,
      },

      include: {
        category:
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

  const primaryImage =
    device.images[0];

  const canEdit =
    device.status !==
    "RENTED";

  const canDelete =
    device.status !==
      "RENTED" &&
    device._count.rentals ===
      0;

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-6 py-7 md:px-10 xl:px-12">
        <div className="mx-auto max-w-[1400px]">
          <Link
            href="/owner/devices"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to devices
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {
                    device.name
                  }
                </h1>

                <span
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyle(
                    device.status,
                  )}`}
                >
                  {formatStatus(
                    device.status,
                  )}
                </span>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                View and manage this listing.
              </p>
            </div>

            {canEdit && (
              <Link
                href={`/owner/devices/${device.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                <Pencil className="h-4 w-4" />
                Edit listing
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10 xl:px-12">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <main className="space-y-6">
            {/* IMAGE GALLERY */}
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {primaryImage ? (
                <>
                  <div className="aspect-[16/9] max-h-[520px] overflow-hidden bg-zinc-100">
                    <img
                      src={
                        primaryImage.url
                      }
                      alt={
                        device.name
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {device.images
                    .length >
                    1 && (
                    <div className="grid grid-cols-3 gap-3 border-t border-zinc-100 p-4 sm:grid-cols-4 md:grid-cols-5">
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
                                ? "border-zinc-900"
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
                <div className="flex min-h-[360px] items-center justify-center bg-zinc-50">
                  <span className="text-[100px]">
                    {device.emoji ??
                      "📦"}
                  </span>
                </div>
              )}

              <div className="border-t border-zinc-100 p-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                  <Tag className="h-3.5 w-3.5" />

                  {
                    device
                      .category
                      .name
                  }
                </span>

                <h2 className="mt-3 text-2xl font-semibold">
                  {
                    device.name
                  }
                </h2>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600">
                  {
                    device.description
                  }
                </p>
              </div>
            </section>

            {/* DETAILS */}
            <section className="rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-6 py-5">
                <h2 className="text-sm font-semibold">
                  Device information
                </h2>
              </div>

              <div className="grid gap-px bg-zinc-100 md:grid-cols-3">
                <div className="bg-white p-6">
                  <p className="text-xs text-zinc-500">
                    Brand
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {device.brand ??
                      "Not specified"}
                  </p>
                </div>

                <div className="bg-white p-6">
                  <p className="text-xs text-zinc-500">
                    Model
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {device.model ??
                      "Not specified"}
                  </p>
                </div>

                <div className="bg-white p-6">
                  <p className="text-xs text-zinc-500">
                    Condition
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatCondition(
                      device.condition,
                    )}
                  </p>
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">
                Listing information
              </h2>

              <div className="mt-6 space-y-5">
                <div className="flex gap-3">
                  <BadgeDollarSign className="h-5 w-5 text-zinc-400" />

                  <div>
                    <p className="text-xs text-zinc-500">
                      Daily rental rate
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      ฿
                      {Number(
                        device.pricePerDay,
                      ).toLocaleString()}
                      /day
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-zinc-400" />

                  <div>
                    <p className="text-xs text-zinc-500">
                      Security deposit
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      ฿
                      {Number(
                        device.depositAmount,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-zinc-400" />

                  <div>
                    <p className="text-xs text-zinc-500">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {device.location ??
                        "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CalendarClock className="h-5 w-5 text-zinc-400" />

                  <div>
                    <p className="text-xs text-zinc-500">
                      Created
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {device.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">
                Listing status
              </h2>

              <span
                className={`mt-4 inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyle(
                  device.status,
                )}`}
              >
                {formatStatus(
                  device.status,
                )}
              </span>

              {device.status ===
                "PENDING_APPROVAL" && (
                <p className="mt-4 text-xs leading-5 text-zinc-500">
                  This listing is waiting for administrator approval.
                </p>
              )}

              {device.status ===
                "AVAILABLE" && (
                <p className="mt-4 text-xs leading-5 text-zinc-500">
                  This listing is approved and publicly available.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">
                Listing management
              </h2>

              {canEdit && (
                <Link
                  href={`/owner/devices/${device.id}/edit`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit listing
                </Link>
              )}

              <div className="mt-3">
                {canDelete ? (
                  <DeleteDeviceButton
                    deviceId={
                      device.id
                    }
                  />
                ) : (
                  <div className="rounded-lg bg-zinc-100 px-4 py-3 text-xs text-zinc-500">
                    This listing cannot be deleted while rented or when rental history exists.
                  </div>
                )}
              </div>
            </section>
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

export default function OwnerDevicePage({
  params,
}: OwnerDevicePageProps) {
  return (
    <Suspense
      fallback={
        <Loading />
      }
    >
      <OwnerDeviceContent
        params={
          params
        }
      />
    </Suspense>
  );
}