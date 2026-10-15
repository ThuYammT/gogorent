import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeDollarSign,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

type OwnerDevicePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatCondition(condition: string) {
  return condition
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function statusStyle(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-100 text-green-700";

    case "PENDING_APPROVAL":
      return "bg-yellow-100 text-yellow-700";

    case "RENTED":
      return "bg-blue-100 text-blue-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

async function OwnerDeviceContent({
  params,
}: OwnerDevicePageProps) {
  const { id } = await params;

  /*
   * TEMPORARY.
   * Replace this with authenticated user ID later.
   */
  const owner = await prisma.user.findFirst({
    where: {
      role: "OWNER",
      status: "ACTIVE",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!owner) {
    notFound();
  }

  const device = await prisma.device.findFirst({
    where: {
      id,
      ownerId: owner.id,
    },
    include: {
      category: true,
    },
  });

  if (!device) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/owner/devices"
        className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-orange-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Devices
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
        {/* LEFT */}
        <div>
          <div className="flex min-h-[440px] items-center justify-center rounded-[40px] bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100">
            <span className="text-[170px]">
              {device.emoji ?? "📦"}
            </span>
          </div>

          <div className="mt-8 rounded-[30px] bg-white p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-orange-500">
                  {device.category.name}
                </p>

                <h1 className="mt-2 text-4xl font-black">
                  {device.name}
                </h1>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-xs font-black ${statusStyle(
                  device.status,
                )}`}
              >
                {formatStatus(device.status)}
              </span>
            </div>

            <p className="mt-6 leading-8 text-zinc-500">
              {device.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-zinc-50 p-5">
                <p className="text-xs font-bold uppercase text-zinc-400">
                  Brand
                </p>

                <p className="mt-2 font-black">
                  {device.brand ?? "Not specified"}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-5">
                <p className="text-xs font-bold uppercase text-zinc-400">
                  Model
                </p>

                <p className="mt-2 font-black">
                  {device.model ?? "Not specified"}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-5">
                <p className="text-xs font-bold uppercase text-zinc-400">
                  Condition
                </p>

                <p className="mt-2 font-black">
                  {formatCondition(
                    device.condition,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <aside>
          <div className="sticky top-28 rounded-[30px] bg-white p-7 shadow-sm">
            <h2 className="text-xl font-black">
              Listing details
            </h2>

            <div className="mt-7 space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100">
                  <BadgeDollarSign className="h-5 w-5 text-green-600" />
                </div>

                <div>
                  <p className="text-xs text-zinc-400">
                    Price per day
                  </p>

                  <p className="font-black">
                    ฿
                    {Number(
                      device.pricePerDay,
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100">
                  <ShieldCheck className="h-5 w-5 text-orange-500" />
                </div>

                <div>
                  <p className="text-xs text-zinc-400">
                    Security deposit
                  </p>

                  <p className="font-black">
                    ฿
                    {Number(
                      device.depositAmount,
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100">
                  <MapPin className="h-5 w-5 text-orange-500" />
                </div>

                <div>
                  <p className="text-xs text-zinc-400">
                    Location
                  </p>

                  <p className="font-black">
                    {device.location ??
                      "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100">
                  <Clock3 className="h-5 w-5 text-zinc-500" />
                </div>

                <div>
                  <p className="text-xs text-zinc-400">
                    Submitted
                  </p>

                  <p className="font-black">
                    {device.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {device.status ===
              "PENDING_APPROVAL" && (
              <div className="mt-7 rounded-2xl bg-yellow-50 p-4">
                <p className="text-sm font-bold text-yellow-700">
                  Waiting for approval
                </p>

                <p className="mt-1 text-xs leading-5 text-yellow-700/70">
                  This listing will become visible to
                  renters after an administrator approves
                  it.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function OwnerDeviceLoading() {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
      <div>
        <div className="h-[440px] animate-pulse rounded-[40px] bg-yellow-50" />

        <div className="mt-8 h-72 animate-pulse rounded-[30px] bg-white" />
      </div>

      <div className="h-[400px] animate-pulse rounded-[30px] bg-white" />
    </div>
  );
}

export default function OwnerDevicePage({
  params,
}: OwnerDevicePageProps) {
  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <Suspense
          fallback={<OwnerDeviceLoading />}
        >
          <OwnerDeviceContent
            params={params}
          />
        </Suspense>
      </div>
    </div>
  );
}