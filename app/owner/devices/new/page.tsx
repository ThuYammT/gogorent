import { Suspense } from "react";

import DeviceListingForm from "@/components/owner/DeviceListingForm";
import { prisma } from "@/lib/prisma";

async function NewDeviceContent() {
  const categories =
    await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

  if (categories.length === 0) {
    return (
      <div className="rounded-[30px] border border-yellow-200 bg-white p-10">
        <div className="text-5xl">📂</div>

        <h1 className="mt-5 text-2xl font-black">
          No categories available
        </h1>

        <p className="mt-2 text-zinc-500">
          At least one device category must exist before
          an owner can create a listing.
        </p>
      </div>
    );
  }

  return (
    <DeviceListingForm
      categories={categories.map(
        (category) => ({
          id: category.id,
          name: category.name,
          emoji: category.emoji,
        }),
      )}
    />
  );
}

function NewDeviceLoading() {
  return (
    <div>
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-100" />

      <div className="mt-6 h-12 w-80 animate-pulse rounded bg-zinc-100" />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="h-[700px] animate-pulse rounded-[30px] bg-white" />

        <div className="h-[350px] animate-pulse rounded-[30px] bg-white" />
      </div>
    </div>
  );
}

export default function NewDevicePage() {
  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <Suspense
          fallback={<NewDeviceLoading />}
        >
          <NewDeviceContent />
        </Suspense>
      </div>
    </div>
  );
}