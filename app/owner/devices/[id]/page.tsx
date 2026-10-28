import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  BadgeDollarSign,
  Clock3,
  MapPin,
  Pencil,
  ShieldCheck,
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
      (letter) =>
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
      (letter) =>
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
  const { id } = await params;

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
        category: true,

        _count: {
          select: {
            rentals: true,
          },
        },
      },
    });

  if (!device) {
    notFound();
  }

  const canEdit =
    device.status !== "RENTED";

  const canDelete =
    device.status !== "RENTED" &&
    device._count.rentals === 0;

  return (
    <div>
      {/* TOP */}
      <div className="mb-7 flex flex-col justify-between gap-4 border-b border-zinc-200 pb-7 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/owner/devices"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            My Devices
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              {device.name}
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
            Listing details and management
          </p>
        </div>

        {canEdit && (
          <Link
            href={`/owner/devices/${device.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <Pencil className="h-4 w-4" />
            Edit listing
          </Link>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* MAIN */}
        <div className="space-y-6">
          {/* DEVICE VISUAL */}
          <section className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex min-h-[350px] items-center justify-center rounded-t-2xl bg-zinc-50">
              <span className="text-[130px]">
                {device.emoji ??
                  "📦"}
              </span>
            </div>

            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                {device.category.name}
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
                {device.name}
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600">
                {device.description}
              </p>
            </div>
          </section>

          {/* INFORMATION */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-950">
              Product information
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="text-xs font-medium text-zinc-500">
                  Brand
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {device.brand ??
                    "Not specified"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="text-xs font-medium text-zinc-500">
                  Model
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {device.model ??
                    "Not specified"}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-4">
                <p className="text-xs font-medium text-zinc-500">
                  Condition
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {formatCondition(
                    device.condition,
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-5">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold text-zinc-950">
              Listing information
            </h2>

            <div className="mt-6 space-y-5">
              <div className="flex gap-3">
                <BadgeDollarSign className="mt-0.5 h-5 w-5 text-zinc-400" />

                <div>
                  <p className="text-xs text-zinc-500">
                    Daily rate
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    ฿
                    {Number(
                      device.pricePerDay,
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-zinc-400" />

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
                <MapPin className="mt-0.5 h-5 w-5 text-zinc-400" />

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
                <Clock3 className="mt-0.5 h-5 w-5 text-zinc-400" />

                <div>
                  <p className="text-xs text-zinc-500">
                    Submitted
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {device.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {device.status ===
              "PENDING_APPROVAL" && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Pending review
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Your listing is waiting for
                  administrator approval.
                </p>
              </div>
            )}

            {device.status ===
              "REJECTED" && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  Listing rejected
                </p>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  Update the listing and submit
                  it for review again.
                </p>
              </div>
            )}
          </section>

          {/* DANGER */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-zinc-950">
              Listing management
            </h2>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Permanently remove this product from
              GoGoRent.
            </p>

            <div className="mt-4">
              {canDelete ? (
                <DeleteDeviceButton
                  deviceId={
                    device.id
                  }
                />
              ) : (
                <div className="rounded-lg bg-zinc-100 px-4 py-3 text-xs leading-5 text-zinc-500">
                  This device cannot be deleted
                  while rented or when rental
                  history exists.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function OwnerDeviceLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="h-[600px] animate-pulse rounded-2xl bg-white" />

      <div className="h-[450px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function OwnerDevicePage({
  params,
}: OwnerDevicePageProps) {
  return (
    <div className="px-6 py-8 md:px-10 xl:px-12">
      <div className="mx-auto max-w-[1400px]">
        <Suspense
          fallback={
            <OwnerDeviceLoading />
          }
        >
          <OwnerDeviceContent
            params={params}
          />
        </Suspense>
      </div>
    </div>
  );
}