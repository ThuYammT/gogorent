"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  CalendarDays,
  Loader2,
} from "lucide-react";

import {
  createRentalRequest,
  type RentalRequestState,
} from "@/app/devices/[id]/actions";

const initialState: RentalRequestState =
  {};

type RentalRequestFormProps = {
  deviceId: string;
  pricePerDay: number;
  depositAmount: number;
};

export default function RentalRequestForm({
  deviceId,
  pricePerDay,
  depositAmount,
}: RentalRequestFormProps) {
  const action =
    createRentalRequest.bind(
      null,
      deviceId,
    );

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    action,
    initialState,
  );

  const [start, setStart] =
    useState("");

  const [end, setEnd] =
    useState("");

  let days = 0;

  if (start && end) {
    const startDate =
      new Date(
        `${start}T00:00:00`,
      );

    const endDate =
      new Date(
        `${end}T00:00:00`,
      );

    const difference =
      endDate.getTime() -
      startDate.getTime();

    if (difference >= 0) {
      days =
        Math.floor(
          difference /
            86400000,
        ) + 1;
    }
  }

  const rentalAmount =
    days *
    pricePerDay;

  const total =
    rentalAmount +
    depositAmount;

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  return (
    <form
      action={formAction}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="startDate"
          className="text-sm font-medium text-zinc-700"
        >
          Start date
        </label>

        <div className="mt-2 flex items-center gap-3 rounded-xl border border-zinc-200 px-3.5">
          <CalendarDays className="h-4 w-4 text-zinc-400" />

          <input
            id="startDate"
            name="startDate"
            type="date"
            min={today}
            required
            value={start}
            onChange={(event) =>
              setStart(
                event.target
                  .value,
              )
            }
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="endDate"
          className="text-sm font-medium text-zinc-700"
        >
          End date
        </label>

        <div className="mt-2 flex items-center gap-3 rounded-xl border border-zinc-200 px-3.5">
          <CalendarDays className="h-4 w-4 text-zinc-400" />

          <input
            id="endDate"
            name="endDate"
            type="date"
            min={
              start ||
              today
            }
            required
            value={end}
            onChange={(event) =>
              setEnd(
                event.target
                  .value,
              )
            }
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="renterNote"
          className="text-sm font-medium text-zinc-700"
        >
          Message to owner
          <span className="ml-1 font-normal text-zinc-400">
            optional
          </span>
        </label>

        <textarea
          id="renterNote"
          name="renterNote"
          rows={3}
          maxLength={500}
          placeholder="Anything the owner should know?"
          className="mt-2 w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <div className="space-y-3 border-t border-zinc-100 pt-5 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">
            ฿
            {pricePerDay.toLocaleString()}{" "}
            × {days || 0}{" "}
            {days === 1
              ? "day"
              : "days"}
          </span>

          <span className="font-medium">
            ฿
            {rentalAmount.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-500">
            Security deposit
          </span>

          <span className="font-medium">
            ฿
            {depositAmount.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between border-t border-zinc-100 pt-3">
          <span className="font-semibold text-zinc-900">
            Total
          </span>

          <span className="text-lg font-semibold text-zinc-950">
            ฿
            {total.toLocaleString()}
          </span>
        </div>
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={
          pending ||
          days <= 0
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending request...
          </>
        ) : (
          "Request to rent"
        )}
      </button>

      <p className="text-center text-xs leading-5 text-zinc-400">
        You are not charged
        when sending a request.
        The owner must approve
        it first.
      </p>
    </form>
  );
}