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

  if (
    categories.length === 0
  ) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10">
        <h1 className="text-xl font-semibold text-zinc-950">
          No categories available
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          At least one device category must
          exist before creating a listing.
        </p>
      </div>
    );
  }

  return (
    <DeviceListingForm
      categories={categories.map(
        (category) => ({
          id: category.id,

          name:
            category.name,

          emoji:
            category.emoji,
        }),
      )}
    />
  );
}

function NewDeviceLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="h-[700px] animate-pulse rounded-2xl bg-white" />

      <div className="h-[350px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function NewDevicePage() {
  return (
    <div className="px-6 py-8 md:px-10 xl:px-12">
      <div className="mx-auto max-w-[1400px]">
        <Suspense
          fallback={
            <NewDeviceLoading />
          }
        >
          <NewDeviceContent />
        </Suspense>
      </div>
    </div>
  );
}