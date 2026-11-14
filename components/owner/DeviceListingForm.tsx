"use client";

import Link from "next/link";

import {
  ArrowLeft,
  BadgeDollarSign,
  Box,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPinned,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useFormStatus,
} from "react-dom";

import {
  createDevice,
  deleteDeviceImage,
  setPrimaryDeviceImage,
  updateDevice,
} from "@/actions/devices";

import LocationPicker from "@/components/owner/LocationPicker";

type Category = {
  id: string;
  name: string;
  emoji: string | null;
};

type ExistingImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

type EditableDevice = {
  id: string;

  name: string;
  categoryId: string;

  description: string;

  brand: string | null;
  model: string | null;

  condition:
    | "NEW"
    | "LIKE_NEW"
    | "GOOD"
    | "FAIR";

  pricePerDay: number;
  depositAmount: number;

  location: string | null;
  latitude: number | null;
  longitude: number | null;

  emoji: string | null;

  status:
    | "PENDING_APPROVAL"
    | "AVAILABLE"
    | "RENTED"
    | "UNAVAILABLE"
    | "REJECTED";

  images: ExistingImage[];
};

type DeviceListingFormProps = {
  categories: Category[];

  mode?: "create" | "edit";

  device?: EditableDevice;
};

function ListingSubmitButton({
  isEdit,
}: {
  isEdit: boolean;
}) {
  const {
    pending,
  } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />

          {isEdit
            ? "Saving changes..."
            : "Creating listing..."}
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4" />

          {isEdit
            ? "Save changes"
            : "Submit listing"}
        </>
      )}
    </button>
  );
}

export default function DeviceListingForm({
  categories,
  mode = "create",
  device,
}: DeviceListingFormProps) {
  const isEdit =
    mode === "edit";

  if (
    isEdit &&
    !device
  ) {
    throw new Error(
      "Device data is required in edit mode.",
    );
  }

  const formAction =
    isEdit && device
      ? updateDevice.bind(
          null,
          device.id,
        )
      : createDevice;

  const existingImages =
    device?.images ?? [];

  const [
    selectedFiles,
    setSelectedFiles,
  ] =
    useState<File[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const previewUrls =
    useMemo(
      () =>
        selectedFiles.map(
          (file) =>
            URL.createObjectURL(
              file,
            ),
        ),

      [selectedFiles],
    );

  useEffect(() => {
    return () => {
      previewUrls.forEach(
        (url) =>
          URL.revokeObjectURL(
            url,
          ),
      );
    };
  }, [previewUrls]);

  const totalImages =
    existingImages.length +
    selectedFiles.length;

  function handleFiles(
    files:
      FileList | null,
  ) {
    if (!files) {
      return;
    }

    const incoming =
      Array.from(files);

    const valid =
      incoming.filter(
        (file) => {
          const allowed =
            [
              "image/jpeg",
              "image/png",
              "image/webp",
            ].includes(
              file.type,
            );

          const sizeOk =
            file.size <=
            5 *
              1024 *
              1024;

          return (
            allowed &&
            sizeOk
          );
        },
      );

    const remaining =
      Math.max(
        0,
        5 -
          existingImages.length,
      );

    const next =
      valid.slice(
        0,
        remaining,
      );

    setSelectedFiles(
      next,
    );
  }

  function syncInputFiles(
    files: File[],
  ) {
    const input =
      fileInputRef.current;

    if (!input) {
      return;
    }

    const transfer =
      new DataTransfer();

    files.forEach(
      (file) =>
        transfer.items.add(
          file,
        ),
    );

    input.files =
      transfer.files;
  }

  function removeSelectedFile(
    index: number,
  ) {
    const next =
      selectedFiles.filter(
        (_, currentIndex) =>
          currentIndex !==
          index,
      );

    setSelectedFiles(
      next,
    );

    syncInputFiles(next);
  }

  return (
    <div>
      <Link
        href={
          isEdit && device
            ? `/owner/devices/${device.id}`
            : "/owner/devices"
        }
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
      >
        <ArrowLeft className="h-4 w-4" />

        {isEdit
          ? "Back to listing"
          : "Back to My Devices"}
      </Link>

      <div className="mt-6">
        <p className="text-sm font-medium text-zinc-500">
          Owner workspace
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
          {isEdit
            ? "Edit listing"
            : "Create a listing"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          {isEdit
            ? "Update your device information and pickup location. Changes will be sent for administrator review again."
            : "Provide device information, photos and a pickup point. Your listing will be reviewed before appearing publicly."}
        </p>
      </div>

      {device?.status ===
        "REJECTED" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            This listing was not approved.
          </p>

          <p className="mt-1 text-sm text-red-600">
            Update the listing and submit it again for administrator review.
          </p>
        </div>
      )}

      <form
        action={formAction}
        className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          {/* DEVICE INFORMATION */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                <Box className="h-5 w-5 text-zinc-600" />
              </div>

              <div>
                <h2 className="font-semibold text-zinc-950">
                  Device information
                </h2>

                <p className="text-sm text-zinc-500">
                  Basic details about your device.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-zinc-700"
                >
                  Device name
                </label>

                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={
                    device?.name ??
                    ""
                  }
                  placeholder="e.g. Sony Alpha A6400"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label
                  htmlFor="categoryId"
                  className="text-sm font-semibold text-zinc-700"
                >
                  Category
                </label>

                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  defaultValue={
                    device?.categoryId ??
                    ""
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.emoji
                          ? `${category.emoji} `
                          : ""}
                        {
                          category.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="condition"
                  className="text-sm font-semibold text-zinc-700"
                >
                  Condition
                </label>

                <select
                  id="condition"
                  name="condition"
                  required
                  defaultValue={
                    device?.condition ??
                    "GOOD"
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="NEW">
                    New
                  </option>

                  <option value="LIKE_NEW">
                    Like new
                  </option>

                  <option value="GOOD">
                    Good
                  </option>

                  <option value="FAIR">
                    Fair
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="brand"
                  className="text-sm font-semibold text-zinc-700"
                >
                  Brand
                </label>

                <input
                  id="brand"
                  name="brand"
                  defaultValue={
                    device?.brand ??
                    ""
                  }
                  placeholder="Sony"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label
                  htmlFor="model"
                  className="text-sm font-semibold text-zinc-700"
                >
                  Model
                </label>

                <input
                  id="model"
                  name="model"
                  defaultValue={
                    device?.model ??
                    ""
                  }
                  placeholder="A6400"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className="text-sm font-semibold text-zinc-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  defaultValue={
                    device?.description ??
                    ""
                  }
                  placeholder="Describe the device, accessories included, condition and anything the renter should know."
                  className="mt-2 w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm leading-6 outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <input
              type="hidden"
              name="emoji"
              value={
                device?.emoji ??
                "📦"
              }
            />
          </section>

          {/* LOCATION */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <MapPinned className="h-5 w-5 text-amber-600" />
              </div>

              <div>
                <h2 className="font-semibold text-zinc-950">
                  Pickup location
                </h2>

                <p className="text-sm text-zinc-500">
                  Choose where the renter will collect the device.
                </p>
              </div>
            </div>

            <LocationPicker
              initialLocation={
                device?.location
              }
              initialLatitude={
                device?.latitude
              }
              initialLongitude={
                device?.longitude
              }
            />
          </section>

          {/* IMAGES */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                  <ImagePlus className="h-5 w-5 text-zinc-600" />
                </div>

                <div>
                  <h2 className="font-semibold text-zinc-950">
                    Device photos
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    JPG, PNG or WebP. Maximum 5 MB each.
                  </p>
                </div>
              </div>

              <span className="text-sm font-semibold text-zinc-500">
                {totalImages} / 5
              </span>
            </div>

            {existingImages.length >
              0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {existingImages.map(
                  (image) => {
                    const setCoverAction =
                      setPrimaryDeviceImage.bind(
                        null,
                        image.id,
                      );

                    const removeAction =
                      deleteDeviceImage.bind(
                        null,
                        image.id,
                      );

                    return (
                      <div
                        key={
                          image.id
                        }
                        className="overflow-hidden rounded-xl border border-zinc-200"
                      >
                        <div className="relative aspect-[4/3] bg-zinc-100">
                          <img
                            src={
                              image.url
                            }
                            alt="Device"
                            className="h-full w-full object-cover"
                          />

                          {image.isPrimary && (
                            <span className="absolute left-2 top-2 rounded-full bg-zinc-950 px-2.5 py-1 text-[10px] font-bold text-white">
                              Cover
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 p-3">
                          {!image.isPrimary && (
                            <button
                              type="submit"
                              formAction={
                                setCoverAction
                              }
                              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                            >
                              Set cover
                            </button>
                          )}

                          <button
                            type="submit"
                            formAction={
                              removeAction
                            }
                            onClick={(
                              event,
                            ) => {
                              if (
                                !window.confirm(
                                  "Remove this photo from the listing?",
                                )
                              ) {
                                event.preventDefault();
                              }
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}

            {previewUrls.length >
              0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  New photos
                </p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {previewUrls.map(
                    (
                      url,
                      index,
                    ) => (
                      <div
                        key={url}
                        className="overflow-hidden rounded-xl border border-zinc-200"
                      >
                        <div className="relative aspect-[4/3]">
                          <img
                            src={url}
                            alt={`Selected ${
                              index +
                              1
                            }`}
                            className="h-full w-full object-cover"
                          />

                          {existingImages.length ===
                            0 &&
                            index ===
                              0 && (
                              <span className="absolute left-2 top-2 rounded-full bg-zinc-950 px-2.5 py-1 text-[10px] font-bold text-white">
                                Cover image
                              </span>
                            )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedFile(
                              index,
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 border-t border-zinc-200 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />

                          Remove
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <label
              className={`mt-6 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm font-semibold transition ${
                totalImages >= 5
                  ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-300"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
              }`}
            >
              <Upload className="h-4 w-4" />

              {totalImages >=
              5
                ? "Maximum 5 photos reached"
                : "Choose photos"}

              <input
                ref={
                  fileInputRef
                }
                type="file"
                name="images"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={
                  totalImages >=
                  5
                }
                className="hidden"
                onChange={(
                  event,
                ) =>
                  handleFiles(
                    event.target
                      .files,
                  )
                }
              />
            </label>
          </section>
        </div>

        {/* RIGHT */}
        <aside className="space-y-6">
          {/* PRICE */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Pricing
                </h2>

                <p className="text-xs text-zinc-500">
                  Set your rental rate.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="pricePerDay"
                className="text-sm font-semibold text-zinc-700"
              >
                Price per day
              </label>

              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                  ฿
                </span>

                <input
                  id="pricePerDay"
                  name="pricePerDay"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  defaultValue={
                    device?.pricePerDay ??
                    ""
                  }
                  className="w-full rounded-xl border border-zinc-200 py-3 pl-8 pr-4 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="depositAmount"
                className="text-sm font-semibold text-zinc-700"
              >
                Security deposit
              </label>

              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                  ฿
                </span>

                <input
                  id="depositAmount"
                  name="depositAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={
                    device?.depositAmount ??
                    ""
                  }
                  className="w-full rounded-xl border border-zinc-200 py-3 pl-8 pr-4 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </div>
          </section>

          {/* ADMIN REVIEW */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />

              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Administrator review
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  New listings and owner edits are reviewed before becoming publicly available.
                </p>
              </div>
            </div>
          </section>

          <ListingSubmitButton
            isEdit={isEdit}
          />
        </aside>
      </form>
    </div>
  );
}