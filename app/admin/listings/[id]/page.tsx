import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { approveDevice, rejectDevice } from "./actions";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type AdminDevicePageProps = {
  params: Promise<{ id: string }>;
};

async function AdminDeviceDetails({ params }: AdminDevicePageProps) {
  await requireAdmin();
  const { id } = await params;

  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      category: true,
      owner: {
        select: { name: true, email: true },
      },
      images: {
        orderBy: { isPrimary: "desc" },
      },
    },
  });

  if (!device) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <Link
        href="/admin/dashboard"
        className="text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        &larr; Back to dashboard
      </Link>

      <article className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {device.images.length > 0 ? (
          <div className="grid gap-2 bg-gray-50 p-4 sm:grid-cols-2">
            {device.images.map((image) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={image.id}
                src={image.url}
                alt={device.name}
                className="h-64 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center bg-amber-50 text-7xl">
            {device.emoji ?? "📦"}
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                {device.category.name}
              </p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                {device.name}
              </h1>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
              {device.status.replaceAll("_", " ")}
            </span>
          </div>

          <p className="mt-5 whitespace-pre-wrap text-gray-700">
            {device.description}
          </p>

          <dl className="mt-6 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Owner</dt>
              <dd className="font-medium text-gray-900">{device.owner.name}</dd>
              <dd className="text-sm text-gray-600">{device.owner.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Price per day</dt>
              <dd className="font-medium text-gray-900">
                ฿{Number(device.pricePerDay).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Deposit</dt>
              <dd className="font-medium text-gray-900">
                ฿{Number(device.depositAmount).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Condition</dt>
              <dd className="font-medium text-gray-900">
                {device.condition.replaceAll("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Brand</dt>
              <dd className="font-medium text-gray-900">
                {device.brand ?? "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Location</dt>
              <dd className="font-medium text-gray-900">
                {device.location ?? "Not specified"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Submitted</dt>
              <dd className="font-medium text-gray-900">
                {device.createdAt.toLocaleDateString()}
              </dd>
            </div>
          </dl>

          {device.status === "PENDING_APPROVAL" ? (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-gray-100 pt-6">
              <form action={approveDevice}>
                <input type="hidden" name="deviceId" value={device.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                >
                  Approve
                </button>
              </form>
              <form action={rejectDevice}>
                <input type="hidden" name="deviceId" value={device.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800"
                >
                  Reject
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </article>
    </main>
  );
}

function AdminDeviceLoading() {
  return (
    <main
      aria-label="Loading device details"
      className="mx-auto mt-6 h-[480px] max-w-4xl animate-pulse rounded-xl bg-gray-100 p-6"
    />
  );
}

export default function AdminDevicePage({ params }: AdminDevicePageProps) {
  return (
    <Suspense fallback={<AdminDeviceLoading />}>
      <AdminDeviceDetails params={params} />
    </Suspense>
  );
}
