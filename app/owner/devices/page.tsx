import { Suspense } from "react";
import Link from "next/link";
import {
  Box,
  Clock3,
  MapPin,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

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

    case "UNAVAILABLE":
      return "bg-zinc-100 text-zinc-600";

    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

async function OwnerDevicesContent() {
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
    return (
      <div className="rounded-[30px] bg-white p-10 text-center">
        <div className="text-5xl">
          👤
        </div>

        <h2 className="mt-5 text-2xl font-black">
          No owner account found
        </h2>

        <p className="mt-2 text-zinc-500">
          An owner account is required before devices can
          be listed.
        </p>
      </div>
    );
  }

  const devices = await prisma.device.findMany({
    where: {
      ownerId: owner.id,
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (devices.length === 0) {
    return (
      <div className="rounded-[35px] border border-dashed border-yellow-200 bg-white p-14 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
          <Box className="h-9 w-9 text-orange-500" />
        </div>

        <h2 className="mt-6 text-2xl font-black">
          No devices listed yet.
        </h2>

        <p className="mx-auto mt-2 max-w-md text-zinc-500">
          Turn your unused electronics into income by
          creating your first GoGoRent listing.
        </p>

        <Link
          href="/owner/devices/new"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-7 py-4 font-bold text-white shadow-lg shadow-orange-100"
        >
          <Plus className="h-5 w-5" />
          Add your first device
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {devices.map((device) => (
        <Link
          key={device.id}
          href={`/owner/devices/${device.id}`}
          className="group overflow-hidden rounded-[30px] border border-yellow-100 bg-white transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex h-52 items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
            <span className="text-8xl transition group-hover:scale-110">
              {device.emoji ?? "📦"}
            </span>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-orange-500">
                  {device.category.name}
                </p>

                <h2 className="mt-1 text-xl font-black text-zinc-900">
                  {device.name}
                </h2>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[11px] font-black ${statusStyle(
                  device.status,
                )}`}
              >
                {formatStatus(device.status)}
              </span>
            </div>

            <div className="mt-5">
              <p className="text-xl font-black">
                ฿
                {Number(
                  device.pricePerDay,
                ).toLocaleString()}

                <span className="text-sm font-normal text-zinc-400">
                  {" "}
                  / day
                </span>
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />

                {device.location ?? "No location"}
              </span>

              <span className="flex items-center gap-1">
                <Clock3 className="h-4 w-4" />

                {device.createdAt.toLocaleDateString()}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function OwnerDevicesLoading() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-[420px] animate-pulse rounded-[30px] bg-white"
        />
      ))}
    </div>
  );
}

export default function OwnerDevicesPage() {
  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-orange-600">
              My Listings
            </span>

            <h1 className="mt-5 text-4xl font-black">
              My Devices
            </h1>

            <p className="mt-2 text-zinc-500">
              Manage the electronics you rent through
              GoGoRent.
            </p>
          </div>

          <Link
            href="/owner/devices/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4 font-bold text-white shadow-lg shadow-orange-100 transition hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5" />
            Add Device
          </Link>
        </div>

        <Suspense
          fallback={<OwnerDevicesLoading />}
        >
          <OwnerDevicesContent />
        </Suspense>
      </div>
    </div>
  );
}