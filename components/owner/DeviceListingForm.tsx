"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BadgeDollarSign,
  Box,
  Check,
  ImagePlus,
  MapPin,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";

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

  const existingImages =
    device?.images ?? [];

  const existingImageCount =
    existingImages.length;

  const remainingSlots =
    Math.max(
      0,
      5 -
        existingImageCount,
    );

  const [previewUrls, setPreviewUrls] =
    useState<
      string[]
    >([]);

  const [
    imageError,
    setImageError,
  ] = useState<string | null>(
    null,
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

  function handleImagesChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    previewUrls.forEach(
      (url) =>
        URL.revokeObjectURL(
          url,
        ),
    );

    const files =
      Array.from(
        event.target.files ??
          [],
      );

    if (
      files.length >
      remainingSlots
    ) {
      setImageError(
        `You can add ${remainingSlots} more image${
          remainingSlots === 1
            ? ""
            : "s"
        }.`,
      );

      event.target.value =
        "";

      setPreviewUrls(
        [],
      );

      return;
    }

    const invalidFile =
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

    if (invalidFile) {
      setImageError(
        "Only JPG, PNG and WEBP images are supported.",
      );

      event.target.value =
        "";

      setPreviewUrls(
        [],
      );

      return;
    }

    const oversizedFile =
      files.find(
        (file) =>
          file.size >
          5 *
            1024 *
            1024,
      );

    if (oversizedFile) {
      setImageError(
        `${oversizedFile.name} exceeds the 5 MB limit.`,
      );

      event.target.value =
        "";

      setPreviewUrls(
        [],
      );

      return;
    }

    setImageError(null);

    setPreviewUrls(
      files.map((file) =>
        URL.createObjectURL(
          file,
        ),
      ),
    );
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

      {/* EXISTING PHOTOS */}
      {isEdit &&
        existingImages.length >
          0 && (
          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-6 py-5">
              <h2 className="text-sm font-semibold text-zinc-950">
                Current photos
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Choose the cover image or remove photos from this listing.
              </p>
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
                            Cover
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
                            <button
                              type="submit"
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Set cover
                            </button>
                          </form>
                        )}

                        <form
                          action={
                            deleteAction
                          }
                          className={
                            image.isPrimary
                              ? "w-full"
                              : ""
                          }
                        >
                          <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </section>
        )}

      {/* MAIN FORM */}
      <form
        action={formAction}
        className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]"
      >
        <div className="space-y-6">
          {/* IMAGE UPLOAD */}
          <section className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
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
                        className="relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
                      >
                        <img
                          src={
                            url
                          }
                          alt={`Selected image ${
                            index +
                            1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        {existingImageCount ===
                          0 &&
                          index ===
                            0 && (
                            <span className="absolute left-2 top-2 rounded-md bg-zinc-950 px-2 py-1 text-[10px] font-semibold text-white">
                              Cover
                            </span>
                          )}
                      </div>
                    ),
                  )}
                </div>
              )}

              {remainingSlots >
              0 ? (
                <label
                  htmlFor="images"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center transition hover:border-zinc-400 hover:bg-zinc-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                    <ImagePlus className="h-5 w-5 text-zinc-600" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-zinc-800">
                    Upload device photos
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    JPG, PNG or WEBP · Max 5 MB each
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {remainingSlots} photo
                    {remainingSlots ===
                    1
                      ? ""
                      : "s"}{" "}
                    remaining
                  </p>

                  <input
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
                <div className="rounded-xl bg-zinc-50 px-5 py-4 text-sm text-zinc-500">
                  Maximum of 5 photos reached.
                </div>
              )}

              {imageError && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {imageError}
                </p>
              )}

              <p className="mt-3 text-xs leading-5 text-zinc-400">
                The first photo uploaded to a new listing becomes the cover image.
                You can change the cover later.
              </p>
            </div>
          </section>

          {/* INFORMATION */}
          <section className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                <Box className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-zinc-950">
                  Device information
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Basic information about your item.
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
                  placeholder="Describe the device, accessories, condition and anything renters should know."
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
                <BadgeDollarSign className="h-4 w-4 text-zinc-600" />
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
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
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
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
                <MapPin className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  Location
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Where this device is available.
                </p>
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

        {/* ACTION PANEL */}
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
                      : "New listings become public only after administrator approval."}
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
                Review the details and photos before continuing.
              </p>

              <button
                type="submit"
                className="mt-5 w-full rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                {isEdit
                  ? "Save changes"
                  : "Submit for review"}
              </button>

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