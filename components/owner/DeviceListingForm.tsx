import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  Box,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  createDevice,
  updateDevice,
} from "@/actions/devices";

type Category = {
  id: string;
  name: string;
  emoji: string | null;
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
};

type DeviceListingFormProps = {
  categories: Category[];

  mode?: "create" | "edit";

  device?: EditableDevice;
};

export default function DeviceListingForm({
  categories,
  mode = "create",
  device,
}: DeviceListingFormProps) {
  const isEdit = mode === "edit";

  if (isEdit && !device) {
    throw new Error(
      "Device data is required in edit mode.",
    );
  }

  const formAction =
    isEdit && device
      ? updateDevice.bind(null, device.id)
      : createDevice;

  return (
    <div>
      <Link
        href={
          isEdit && device
            ? `/owner/devices/${device.id}`
            : "/owner/devices"
        }
        className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-orange-500"
      >
        <ArrowLeft className="h-4 w-4" />

        {isEdit
          ? "Back to Listing"
          : "Back to My Devices"}
      </Link>

      <div className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-orange-600">
          <Sparkles className="h-4 w-4" />

          {isEdit
            ? "Edit Listing"
            : "New Listing"}
        </span>

        <h1 className="mt-5 text-4xl font-black text-zinc-900">
          {isEdit
            ? "Update your device."
            : "List your device."}
        </h1>

        <p className="mt-3 max-w-2xl text-zinc-500">
          {isEdit
            ? "Update your device information. Changes will be sent for admin approval again."
            : "Tell renters about your device. Your listing will be reviewed before it becomes publicly available."}
        </p>
      </div>

      <form
        action={formAction}
        className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]"
      >
        {/* LEFT */}
        <div className="space-y-7">
          {/* DEVICE INFORMATION */}
          <section className="rounded-[30px] bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100">
                <Box className="h-5 w-5 text-orange-500" />
              </div>

              <div>
                <h2 className="font-black">
                  Device information
                </h2>

                <p className="text-sm text-zinc-400">
                  Basic information about your item.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* NAME */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-bold"
                >
                  Device name *
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={
                    device?.name ?? ""
                  }
                  placeholder="e.g. Sony A6400"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>

              {/* CATEGORY */}
              <div>
                <label
                  htmlFor="categoryId"
                  className="mb-2 block text-sm font-bold"
                >
                  Category *
                </label>

                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  defaultValue={
                    device?.categoryId ?? ""
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none transition focus:border-orange-400 focus:bg-white"
                >
                  <option
                    value=""
                    disabled
                  >
                    Select a category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.emoji ??
                          "📦"}{" "}
                        {category.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-bold"
                >
                  Description *
                </label>

                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  defaultValue={
                    device?.description ?? ""
                  }
                  placeholder="Describe your device, what it includes, and anything renters should know..."
                  className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* BRAND */}
                <div>
                  <label
                    htmlFor="brand"
                    className="mb-2 block text-sm font-bold"
                  >
                    Brand
                  </label>

                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    defaultValue={
                      device?.brand ?? ""
                    }
                    placeholder="e.g. Sony"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none transition focus:border-orange-400 focus:bg-white"
                  />
                </div>

                {/* MODEL */}
                <div>
                  <label
                    htmlFor="model"
                    className="mb-2 block text-sm font-bold"
                  >
                    Model
                  </label>

                  <input
                    id="model"
                    name="model"
                    type="text"
                    defaultValue={
                      device?.model ?? ""
                    }
                    placeholder="e.g. A6400"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none transition focus:border-orange-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* CONDITION */}
              <div>
                <label
                  htmlFor="condition"
                  className="mb-2 block text-sm font-bold"
                >
                  Condition *
                </label>

                <select
                  id="condition"
                  name="condition"
                  required
                  defaultValue={
                    device?.condition ?? ""
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none transition focus:border-orange-400 focus:bg-white"
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
          </section>

          {/* PRICING */}
          <section className="rounded-[30px] bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100">
                <BadgeDollarSign className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <h2 className="font-black">
                  Pricing
                </h2>

                <p className="text-sm text-zinc-400">
                  Set your rental price and security
                  deposit.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* PRICE */}
              <div>
                <label
                  htmlFor="pricePerDay"
                  className="mb-2 block text-sm font-bold"
                >
                  Price per day *
                </label>

                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">
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
                    placeholder="500"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-10 pr-5 outline-none transition focus:border-orange-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* DEPOSIT */}
              <div>
                <label
                  htmlFor="depositAmount"
                  className="mb-2 block text-sm font-bold"
                >
                  Security deposit *
                </label>

                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">
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
                    placeholder="3000"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-4 pl-10 pr-5 outline-none transition focus:border-orange-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* LOCATION */}
          <section className="rounded-[30px] bg-white p-7 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100">
                <MapPin className="h-5 w-5 text-orange-500" />
              </div>

              <div>
                <h2 className="font-black">
                  Location & display
                </h2>

                <p className="text-sm text-zinc-400">
                  Where renters can find your device.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[1fr_150px]">
              {/* LOCATION */}
              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-bold"
                >
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  defaultValue={
                    device?.location ?? ""
                  }
                  placeholder="e.g. Bangkok"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>

              {/* EMOJI */}
              <div>
                <label
                  htmlFor="emoji"
                  className="mb-2 block text-sm font-bold"
                >
                  Emoji
                </label>

                <input
                  id="emoji"
                  name="emoji"
                  type="text"
                  maxLength={8}
                  defaultValue={
                    device?.emoji ?? ""
                  }
                  placeholder="📷"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-center text-xl outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT */}
        <aside>
          <div className="sticky top-28 rounded-[30px] border border-yellow-100 bg-white p-6 shadow-lg shadow-yellow-100/40">
            <h2 className="text-xl font-black">
              {isEdit
                ? "Save changes?"
                : "Ready to list?"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {isEdit
                ? "Review your changes before saving."
                : "Check your information before submitting."}
            </p>

            <div className="mt-6 rounded-2xl bg-yellow-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />

                <div>
                  <p className="text-sm font-bold">
                    Admin approval required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {isEdit
                      ? "After editing, your listing will return to Pending Approval."
                      : "Your device will remain hidden from renters until an administrator approves it."}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 py-4 font-black text-white shadow-lg shadow-orange-100 transition hover:scale-[1.02]"
            >
              {isEdit
                ? "Save Changes"
                : "Submit Listing"}
            </button>

            <Link
              href={
                isEdit && device
                  ? `/owner/devices/${device.id}`
                  : "/owner/devices"
              }
              className="mt-3 block w-full rounded-2xl border border-zinc-200 py-4 text-center font-bold text-zinc-600 transition hover:bg-zinc-50"
            >
              Cancel
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}