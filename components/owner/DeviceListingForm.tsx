"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  BadgeDollarSign,
  Box,
  Check,
  ImagePlus,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { useFormStatus } from "react-dom";

import {
  createDevice,
  deleteDeviceImage,
  setPrimaryDeviceImage,
  updateDevice,
} from "@/actions/devices";

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
  emoji: string | null;

  status?:
    | "PENDING_APPROVAL"
    | "AVAILABLE"
    | "RENTED"
    | "UNAVAILABLE"
    | "REJECTED";

  images?: ExistingImage[];
};

type DeviceListingFormProps = {
  categories: Category[];
  mode?: "create" | "edit";
  device?: EditableDevice;
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100";

const labelClass =
  "mb-2 block text-sm font-medium text-zinc-700";

/* ======================================================
   MAIN SUBMIT BUTTON
====================================================== */

function ListingSubmitButton({
  isEdit,
}: {
  isEdit: boolean;
}) {
  const { pending } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />

          {isEdit
            ? "Saving changes..."
            : "Creating listing..."}
        </>
      ) : isEdit ? (
        "Save changes"
      ) : (
        "Submit for review"
      )}
    </button>
  );
}

/* ======================================================
   SMALL IMAGE ACTION BUTTON
====================================================== */

function ImageActionButton({
  type,
}: {
  type: "cover" | "delete";
}) {
  const { pending } =
    useFormStatus();

  if (type === "cover") {
    return (
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}

        {pending
          ? "Updating..."
          : "Set cover"}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}

      {pending
        ? "Removing..."
        : "Remove"}
    </button>
  );
}

/* ======================================================
   FORM
====================================================== */

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

  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const existingImages =
    device?.images ?? [];

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState<File[]>([]);

  const [
    previewUrls,
    setPreviewUrls,
  ] = useState<string[]>([]);

  const [
    imageError,
    setImageError,
  ] = useState<string | null>(
    null,
  );

  const totalImageCount =
    existingImages.length +
    selectedFiles.length;

  const remainingSlots =
    Math.max(
      0,
      5 - totalImageCount,
    );

  /*
   * Generate browser previews.
   */
  useEffect(() => {
    const urls =
      selectedFiles.map(
        (file) =>
          URL.createObjectURL(
            file,
          ),
      );

    setPreviewUrls(urls);

    return () => {
      urls.forEach(
        (url) =>
          URL.revokeObjectURL(
            url,
          ),
      );
    };
  }, [selectedFiles]);

  function updateFileInput(
    files: File[],
  ) {
    if (!inputRef.current) {
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

    inputRef.current.files =
      transfer.files;
  }

  function validateFiles(
    files: File[],
  ) {
    if (
      existingImages.length +
        files.length >
      5
    ) {
      return "A listing can have a maximum of 5 photos.";
    }

    const invalid =
      files.find(
        (file) =>
          ![
            "image/jpeg",
            "image/png",
            "image/webp",
          ].includes(
            file.type,
          ),
      );

    if (invalid) {
      return "Only JPG, PNG and WEBP images are supported.";
    }

    const oversized =
      files.find(
        (file) =>
          file.size >
          5 *
            1024 *
            1024,
      );

    if (oversized) {
      return `${oversized.name} exceeds the 5 MB limit.`;
    }

    return null;
  }

  function handleImagesChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files =
      Array.from(
        event.target.files ??
          [],
      );

    const error =
      validateFiles(files);

    if (error) {
      setImageError(
        error,
      );

      setSelectedFiles(
        [],
      );

      event.target.value =
        "";

      return;
    }

    setImageError(null);

    setSelectedFiles(
      files,
    );
  }

  function removeSelectedFile(
    index: number,
  ) {
    const nextFiles =
      selectedFiles.filter(
        (
          _,
          fileIndex,
        ) =>
          fileIndex !==
          index,
      );

    setSelectedFiles(
      nextFiles,
    );

    updateFileInput(
      nextFiles,
    );

    setImageError(null);
  }

  const formAction =
    isEdit &&
    device
      ? updateDevice.bind(
          null,
          device.id,
        )
      : createDevice;

  const cancelHref =
    isEdit &&
    device
      ? `/owner/devices/${device.id}`
      : "/owner/devices";

  return (
    <div>
      <Link
        href={cancelHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
      >
        <ArrowLeft className="h-4 w-4" />

        {isEdit
          ? "Back to listing"
          : "Back to devices"}
      </Link>

      {/* HEADER */}
      <div className="mt-6 border-b border-zinc-200 pb-7">
        <p className="text-sm font-medium text-zinc-500">
          {isEdit
            ? "Listing management"
            : "Inventory management"}
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
          {isEdit
            ? "Edit device"
            : "Add new device"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          {isEdit
            ? "Update your listing details and photos. Changes will return the listing to administrator review."
            : "Create a professional listing for your device. It will be reviewed before becoming publicly available."}
        </p>
      </div>

      {/* REJECTED WARNING */}
      {device?.status ===
        "REJECTED" && (
        <div className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-semibold text-red-800">
              This listing was rejected
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              Review your listing information and photos carefully.
              Saving your changes will resubmit the listing for
              administrator approval.
            </p>
          </div>
        </div>
      )}

      {/* EXISTING PHOTOS */}
      {isEdit &&
        existingImages.length >
          0 && (
          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <h2 className="text-sm font-semibold text-zinc-950">
                  Current photos
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Manage your existing listing photos.
                </p>
              </div>

              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                {totalImageCount} / 5 photos
              </span>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {existingImages.map(
                (
                  image,
                ) => {
                  const deleteAction =
                    deleteDeviceImage.bind(
                      null,
                      image.id,
                    );

                  const primaryAction =
                    setPrimaryDeviceImage.bind(
                      null,
                      image.id,
                    );

                  return (
                    <div
                      key={
                        image.id
                      }
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                        <img
                          src={
                            image.url
                          }
                          alt="Device"
                          className="h-full w-full object-cover"
                        />

                        {image.isPrimary && (
                          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-white">
                            <Star className="h-3 w-3" />
                            Cover image
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 p-3">
                        {!image.isPrimary && (
                          <form
                            action={
                              primaryAction
                            }
                            className="flex-1"
                          >
                            <ImageActionButton type="cover" />
                          </form>
                        )}

                        <form
                          action={
                            deleteAction
                          }
                          onSubmit={(
                            event,
                          ) => {
                            const confirmed =
                              window.confirm(
                                "Remove this photo from the listing?",
                              );

                            if (
                              !confirmed
                            ) {
                              event.preventDefault();
                            }
                          }}
                          className={
                            image.isPrimary
                              ? "w-full"
                              : "flex-1"
                          }
                        >
                          <ImageActionButton type="delete" />
                        </form>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>
        )}

      <form
        action={formAction}
        className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]"
      >
        <div className="space-y-6">
          {/* PHOTOS */}
          <section className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                  <ImagePlus className="h-4 w-4 text-zinc-600" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Device photos
                  </h2>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Add clear photos that accurately represent the device.
                  </p>
                </div>
              </div>

              <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                {totalImageCount} / 5
              </span>
            </div>

            <div className="p-6">
              {previewUrls.length >
                0 && (
                <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {previewUrls.map(
                    (
                      url,
                      index,
                    ) => (
                      <div
                        key={
                          url
                        }
                        className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
                      >
                        <img
                          src={
                            url
                          }
                          alt={`Selected photo ${
                            index +
                            1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        {existingImages.length ===
                          0 &&
                          index ===
                            0 && (
                            <span className="absolute left-2 top-2 rounded-md bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-white">
                              Cover image
                            </span>
                          )}

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedFile(
                              index,
                            )
                          }
                          aria-label="Remove selected image"
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition hover:bg-black group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}

              {totalImageCount <
              5 ? (
                <label
                  htmlFor="images"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center transition hover:border-zinc-400 hover:bg-zinc-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                    <ImagePlus className="h-5 w-5 text-zinc-600" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-zinc-800">
                    Select device photos
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    JPG, PNG or WEBP · Max 5 MB each
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    Up to{" "}
                    {5 -
                      existingImages.length}{" "}
                    new photo
                    {5 -
                      existingImages.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    can be selected
                  </p>

                  <input
                    ref={
                      inputRef
                    }
                    id="images"
                    name="images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={
                      handleImagesChange
                    }
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-center">
                  <Check className="mx-auto h-5 w-5 text-emerald-600" />

                  <p className="mt-2 text-sm font-medium text-zinc-700">
                    Maximum of 5 photos reached
                  </p>
                </div>
              )}

              {imageError && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {
                    imageError
                  }
                </p>
              )}
            </div>
          </section>

          {/* DEVICE INFORMATION */}
          <section className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                <Box className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  Device information
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Basic details about your item.
                </p>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="name"
                  className={
                    labelClass
                  }
                >
                  Device name *
                </label>

                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={
                    device?.name ??
                    ""
                  }
                  placeholder="e.g. Sony A6400"
                  className={
                    inputClass
                  }
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="categoryId"
                    className={
                      labelClass
                    }
                  >
                    Category *
                  </label>

                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    defaultValue={
                      device?.categoryId ??
                      ""
                    }
                    className={
                      inputClass
                    }
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select category
                    </option>

                    {categories.map(
                      (
                        category,
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
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
                    className={
                      labelClass
                    }
                  >
                    Condition *
                  </label>

                  <select
                    id="condition"
                    name="condition"
                    required
                    defaultValue={
                      device?.condition ??
                      ""
                    }
                    className={
                      inputClass
                    }
                  >
                    <option
                      value=""
                      disabled
                    >
                      Select condition
                    </option>

                    <option value="NEW">
                      New
                    </option>

                    <option value="LIKE_NEW">
                      Like New
                    </option>

                    <option value="GOOD">
                      Good
                    </option>

                    <option value="FAIR">
                      Fair
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className={
                    labelClass
                  }
                >
                  Description *
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
                  placeholder="Describe the device, included accessories and condition."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="brand"
                    className={
                      labelClass
                    }
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
                    placeholder="e.g. Sony"
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="model"
                    className={
                      labelClass
                    }
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
                    placeholder="e.g. A6400"
                    className={
                      inputClass
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* PRICING */}
          <section className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                <BadgeDollarSign className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  Pricing
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Rental rate and security deposit.
                </p>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="pricePerDay"
                  className={
                    labelClass
                  }
                >
                  Price per day *
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
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
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="depositAmount"
                  className={
                    labelClass
                  }
                >
                  Security deposit *
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
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
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* LOCATION */}
          <section className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                <MapPin className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  Location
                </h2>
              </div>
            </div>

            <div className="p-6">
              <label
                htmlFor="location"
                className={
                  labelClass
                }
              >
                Location
              </label>

              <input
                id="location"
                name="location"
                defaultValue={
                  device?.location ??
                  ""
                }
                placeholder="e.g. Bangkok"
                className={
                  inputClass
                }
              />

              <input
                type="hidden"
                name="emoji"
                value={
                  device?.emoji ??
                  "📦"
                }
              />
            </div>
          </section>
        </div>

        {/* SIDE ACTIONS */}
        <aside>
          <div className="sticky top-6 space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">
                    Admin review
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {isEdit
                      ? "Saving changes will return this listing to Pending Approval."
                      : "New listings become public after administrator approval."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold">
                {isEdit
                  ? "Save listing"
                  : "Submit listing"}
              </h2>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Review all information before continuing.
              </p>

              <div className="mt-5">
                <ListingSubmitButton
                  isEdit={
                    isEdit
                  }
                />
              </div>

              <Link
                href={
                  cancelHref
                }
                className="mt-2 block rounded-lg border border-zinc-200 px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </Link>
            </section>
          </div>
        </aside>
      </form>
    </div>
  );
}