import { Suspense } from "react";
import { notFound } from "next/navigation";

import DeviceListingForm from "@/components/owner/DeviceListingForm";

import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";

type EditDevicePageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function EditDeviceContent({
  params,
}: EditDevicePageProps) {
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
      },
    });

  if (!device) {
    notFound();
  }

  if (
    device.status ===
    "RENTED"
  ) {
    notFound();
  }

  const categories =
    await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

  if (
    categories.length ===
    0
  ) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10">
        <h1 className="text-xl font-semibold">
          No categories available
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          At least one category is required before editing this listing.
        </p>
      </div>
    );
  }

  return (
    <DeviceListingForm
      mode="edit"
      categories={categories.map(
        (
          category,
        ) => ({
          id:
            category.id,

          name:
            category.name,

          emoji:
            category.emoji,
        }),
      )}
      device={{
        id:
          device.id,

        name:
          device.name,

        categoryId:
          device.categoryId,

        description:
          device.description,

        brand:
          device.brand,

        model:
          device.model,

        condition:
          device.condition,

        pricePerDay:
          Number(
            device.pricePerDay,
          ),

        depositAmount:
          Number(
            device.depositAmount,
          ),

        location:
          device.location,

        emoji:
          device.emoji,

        images:
          device.images.map(
            (
              image,
            ) => ({
              id:
                image.id,

              url:
                image.url,

              isPrimary:
                image.isPrimary,
            }),
          ),
      }}
    />
  );
}

function Loading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="h-[800px] animate-pulse rounded-2xl bg-white" />

      <div className="h-[350px] animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

export default function EditDevicePage({
  params,
}: EditDevicePageProps) {
  return (
    <div className="px-6 py-8 md:px-10 xl:px-12">
      <div className="mx-auto max-w-[1400px]">
        <Suspense
          fallback={
            <Loading />
          }
        >
          <EditDeviceContent
            params={
              params
            }
          />
        </Suspense>
      </div>
    </div>
  );
}