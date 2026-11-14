import {
  Suspense,
} from "react";

import {
  notFound,
} from "next/navigation";

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
  const owner =
    await requireOwner();

  const {
    id,
  } = await params;

  const [
    device,
    categories,
  ] =
    await Promise.all([
      prisma.device.findFirst({
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
      }),

      prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      }),
    ]);

  if (!device) {
    notFound();
  }

  /*
   * Don't allow a currently rented
   * item to be edited.
   */
  if (
    device.status ===
    "RENTED"
  ) {
    notFound();
  }

  return (
    <DeviceListingForm
      mode="edit"
      categories={categories.map(
        (category) => ({
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

        latitude:
          device.latitude,

        longitude:
          device.longitude,

        emoji:
          device.emoji,

        status:
          device.status,

        images:
          device.images.map(
            (image) => ({
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

function EditDeviceLoading() {
  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="h-5 w-32 animate-pulse rounded bg-zinc-200" />

        <div className="mt-6 h-10 w-72 animate-pulse rounded bg-zinc-200" />

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="h-[900px] animate-pulse rounded-2xl bg-white" />

          <div className="h-[400px] animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    </div>
  );
}

export default function EditDevicePage({
  params,
}: EditDevicePageProps) {
  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <Suspense
          fallback={
            <EditDeviceLoading />
          }
        >
          <EditDeviceContent
            params={params}
          />
        </Suspense>
      </div>
    </div>
  );
}