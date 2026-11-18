import Link from "next/link";
import Image from "next/image";

import {
  notFound,
} from "next/navigation";

import {
  Suspense,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileCheck2,
  MapPin,
  Receipt,
  ShieldCheck,
} from "lucide-react";

import {
  cancelRenterBooking,
} from "../actions";

import CollectionQrScanner from "@/components/renter/CollectionQrScanner";
import CollectionConfirmation from "@/components/renter/CollectionConfirmation";
import CollectionIssues from "@/components/renter/CollectionIssues";
import ReturnQr from "@/components/renter/ReturnQr";
import ReturnMeetingPlan from "@/components/renter/ReturnMeetingPlan";
import BookingMeetupDetails from "@/components/bookings/BookingMeetupDetails";
import { bangkokToday, bookingDateKey } from "@/lib/booking-meetings";

import {
  ReportIssueForm,
} from "@/components/renter/CollectionIssueForms";

import {
  collectionIssueInclude,
} from "@/lib/collection-issue-view";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireRenter,
} from "@/lib/session";

function formatTransferReference(
  paymentRef:
    | string
    | null
    | undefined,
) {
  if (!paymentRef) {
    return "—";
  }

  if (
    paymentRef.startsWith(
      "MANUAL:",
    )
  ) {
    return paymentRef.slice(
      "MANUAL:".length,
    );
  }

  return paymentRef;
}

function statusStyle(
  status: string,
) {
  switch (status) {
    case "APPROVED":
      return "bg-indigo-50 text-indigo-700";

    case "ACTIVE":
      return "bg-blue-50 text-blue-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "RETURNED":
      return "bg-amber-50 text-amber-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-zinc-100 text-zinc-600";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

async function RenterBookingContent({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const renter =
    await requireRenter();

  const { id } =
    await params;

  const rental =
    await prisma.rental.findFirst({
      where: {
        id,

        renterId:
          renter.id,
      },

      include: {
        device: {
          select: {
            name: true,
            emoji: true,
            location: true,
            condition: true,
            images: {
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
              take: 1,
              select: { url: true },
            },
          },
        },

        handovers: {
          select: {
            type: true,
            status: true,
          },
        },

        transactions: {
          where: {
            type: {
              in: [
                "RENTAL_PAYMENT",
                "DEPOSIT_HOLD",
                "DEPOSIT_REFUND",
                "OWNER_PAYOUT",
                "PLATFORM_FEE",
              ],
            },
          },

          select: {
            id: true,
            type: true,
            status: true,
            amount: true,
            paymentRef: true,
            receiptPath: true,
            createdAt: true,
          },

          orderBy: {
            createdAt:
              "desc",
          },
        },

        collectionIssues: {
          include:
            collectionIssueInclude,

          orderBy: {
            createdAt:
              "desc",
          },
        },
      },
    });

  if (!rental) {
    notFound();
  }
  const returnOverdue = bookingDateKey(rental.endDate) < bangkokToday();

  const hasOpenIssue =
    rental.collectionIssues.some(
      (issue) =>
        issue.status !==
        "RESOLVED",
    );

  const paymentComplete =
    rental.transactions.some(
      (transaction) =>
        transaction.type ===
          "RENTAL_PAYMENT" &&
        transaction.status ===
          "COMPLETED",
    ) &&
    rental.transactions.some(
      (transaction) =>
        transaction.type ===
          "DEPOSIT_HOLD" &&
        transaction.status ===
          "COMPLETED",
    );

  const paymentStarted =
    rental.transactions.some(
      (transaction) =>
        Boolean(
          transaction.paymentRef,
        ) &&
        transaction.status ===
          "PENDING",
    );

  const simulatedRefundComplete =
    rental.transactions.some(
      (transaction) =>
        transaction.type ===
          "RENTAL_PAYMENT" &&
        transaction.status ===
          "REFUNDED",
    ) &&
    rental.transactions.some(
      (transaction) =>
        transaction.type ===
          "DEPOSIT_HOLD" &&
        transaction.status ===
          "REFUNDED",
    ) &&
    rental.transactions.some(
      (transaction) =>
        transaction.type ===
          "DEPOSIT_REFUND" &&
        transaction.status ===
          "COMPLETED",
    );

  const collectionQrScanned =
    rental.handovers.some(
      (handover) =>
        handover.type ===
          "COLLECTION" &&
        handover.status ===
          "QR_SCANNED",
    );

  const collectionVerified =
    rental.handovers.some(
      (handover) =>
        handover.type ===
          "COLLECTION" &&
        handover.status ===
          "VERIFIED",
    );

  const returnQrScanned =
    rental.handovers.some(
      (handover) =>
        handover.type ===
          "RETURN" &&
        handover.status ===
          "QR_SCANNED",
    );

  const depositRefund =
    rental.transactions.find(
      (transaction) =>
        transaction.type ===
        "DEPOSIT_REFUND",
    );

  const ownerPayout =
    rental.transactions.find(
      (transaction) =>
        transaction.type ===
        "OWNER_PAYOUT",
    );

  const refundReference =
    formatTransferReference(
      depositRefund?.paymentRef,
    );

  return (
    <main className="p-5 md:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/renter/rentals"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />

          Back to bookings
        </Link>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {/* HEADER */}
          <div className="flex flex-col justify-between gap-5 border-b border-zinc-100 p-6 md:flex-row md:items-start md:p-7">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-50 text-3xl">
                {rental.device.images[0]?.url ? (
                  <Image
                    src={rental.device.images[0].url}
                    alt={rental.device.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (rental.device.emoji ?? "📦")}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Booking #
                  {rental.id.slice(
                    -6,
                  )}
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">
                  {
                    rental.device
                      .name
                  }
                </h1>
              </div>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(
                rental.status,
              )}`}
            >
              {rental.status.replaceAll(
                "_",
                " ",
              )}
            </span>
          </div>

          {/* DETAILS */}
          <div className="grid gap-6 p-6 md:grid-cols-2 md:p-7">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <CalendarDays className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500">
                  Rental period
                </p>

                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {rental.startDate.toLocaleDateString()}
                  {" "}–{" "}
                  {rental.endDate.toLocaleDateString()}
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  {
                    rental.totalDays
                  }{" "}
                  {rental.totalDays ===
                  1
                    ? "day"
                    : "days"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <MapPin className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500">
                  Device location
                </p>

                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {rental.device.location ??
                    "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <Receipt className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500">
                  Rental amount
                </p>

                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  ฿
                  {Number(
                    rental.rentalAmount,
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <ShieldCheck className="h-4 w-4 text-zinc-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-500">
                  Security deposit
                </p>

                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  ฿
                  {Number(
                    rental.depositAmount,
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 px-6 py-5 md:px-7"><BookingMeetupDetails rental={rental} /></div>

          {rental.rejectReason && (
            <div className="mx-6 mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 md:mx-7">
              <p className="font-semibold">
                Booking rejected
              </p>

              <p className="mt-1">
                {
                  rental.rejectReason
                }
              </p>
            </div>
          )}

          {rental.renterNote && (
            <div className="border-t border-zinc-100 px-6 py-5 md:px-7">
              <p className="text-sm font-semibold text-zinc-900">
                Your note
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                {
                  rental.renterNote
                }
              </p>
            </div>
          )}

          {/* PAYMENT + COLLECTION */}
          {rental.status ===
            "APPROVED" && (
            <div className="border-t border-zinc-100 px-6 py-6 md:px-7">
              {hasOpenIssue ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold">
                    Collection is paused
                  </p>

                  <p className="mt-1">
                    The reported device issue must be resolved before collection can continue.
                  </p>
                </div>
              ) : !paymentComplete ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <p className="text-sm font-semibold text-blue-900">
                    Payment required before collection
                  </p>

                  <p className="mt-1 text-sm text-blue-700">
                    Pay the rental fee and security deposit with PromptPay.
                  </p>

                  <Link
                    href={`/renter/rentals/${rental.id}/payment`}
                    className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Pay with PromptPay
                  </Link>
                </div>
              ) : collectionQrScanned ? (
                <CollectionConfirmation
                  rentalId={
                    rental.id
                  }
                  condition={
                    rental.device
                      .condition
                  }
                />
              ) : collectionVerified ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                  Collection confirmed.
                </div>
              ) : (
                <CollectionQrScanner
                  rentalId={
                    rental.id
                  }
                />
              )}
            </div>
          )}

          {/* RETURN */}
          {rental.status ===
            "ACTIVE" && (
            <div className="border-t border-zinc-100 px-6 py-6 md:px-7">
              {!returnQrScanned && !returnOverdue && <ReturnMeetingPlan
                key={rental.updatedAt.toISOString()}
                rentalId={rental.id} date={bookingDateKey(rental.endDate)}
                initial={{ time: rental.returnTime, location: rental.returnLocation ?? rental.pickupLocation, latitude: rental.returnLatitude ?? rental.pickupLatitude, longitude: rental.returnLongitude ?? rental.pickupLongitude, instructions: rental.returnInstructions }}
              />}
              {returnOverdue && !returnQrScanned && <p className="mb-4 text-sm text-amber-800">Your booked return date has passed. Contact the owner to arrange the meeting. You can still use the return QR when you meet.</p>}
              {returnQrScanned ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                  <p className="font-semibold">
                    Return QR scanned
                  </p>

                  <p className="mt-1">
                    The owner now needs to confirm the returned device.
                  </p>
                </div>
              ) : returnOverdue || rental.returnTime && rental.returnLocation ? (
                <ReturnQr
                  key={rental.updatedAt.toISOString()}
                  rentalId={
                    rental.id
                  }
                />
              ) : (
                <p className="text-sm text-zinc-500">Save your return meeting above before generating the return QR.</p>
              )}
            </div>
          )}

          {/* RETURNED */}
          {rental.status ===
            "RETURNED" && (
            <div className="border-t border-zinc-100 px-6 py-6 md:px-7">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-semibold text-amber-900">
                  Device returned
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  GoGoRent is processing the financial settlement.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-zinc-500">
                      Deposit refund
                    </p>

                    <p className="mt-1 font-semibold">
                      ฿
                      {Number(
                        rental.depositAmount,
                      ).toLocaleString()}
                    </p>

                    <p className="mt-1 text-xs font-semibold">
                      {depositRefund?.status ??
                        "PENDING"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-zinc-500">
                      Owner payout
                    </p>

                    <p className="mt-1 text-xs font-semibold">
                      {ownerPayout?.status ??
                        "PENDING"}
                    </p>
                  </div>
                </div>

                {depositRefund?.status ===
                  "COMPLETED" && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
                    <p className="font-semibold text-emerald-900">
                      Deposit refunded
                    </p>

                    <p className="mt-2 text-sm text-zinc-600">
                      Reference:{" "}
                      <span className="font-semibold text-zinc-900">
                        {
                          refundReference
                        }
                      </span>
                    </p>

                    {depositRefund.receiptPath && (
                      <a
                        href={`/settlement-receipts/${depositRefund.id}`}
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        <FileCheck2 className="h-4 w-4" />

                        View Admin refund receipt

                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPLETED */}
          {rental.status ===
            "COMPLETED" && (
            <div className="border-t border-zinc-100 px-6 py-6 md:px-7">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="font-semibold text-emerald-900">
                  Rental completed
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  The device was returned and the financial settlement has been completed.
                </p>

                {depositRefund?.status ===
                  "COMPLETED" && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                      <div className="flex-1">
                        <p className="font-semibold text-zinc-950">
                          Security deposit refunded
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-zinc-950">
                          ฿
                          {Number(
                            depositRefund.amount,
                          ).toLocaleString()}
                        </p>

                        <p className="mt-3 text-sm text-zinc-600">
                          Transfer reference:{" "}
                          <span className="font-semibold text-zinc-950">
                            {
                              refundReference
                            }
                          </span>
                        </p>

                        {depositRefund.receiptPath ? (
                          <a
                            href={`/settlement-receipts/${depositRefund.id}`}
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                          >
                            <FileCheck2 className="h-4 w-4" />

                            View Admin refund receipt

                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <p className="mt-3 text-xs text-zinc-500">
                            Receipt unavailable.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DEVICE ISSUES */}
          {(rental.status ===
            "APPROVED" ||
            rental.collectionIssues.length >
              0) && (
            <div className="border-t border-zinc-100 px-6 py-6 md:px-7">
              <h2 className="mb-4 text-base font-semibold text-zinc-900">
                Device issues
              </h2>

              <CollectionIssues
                rentalId={
                  rental.id
                }
                issues={
                  rental.collectionIssues
                }
                role="RENTER"
                canAct={
                  rental.status ===
                  "APPROVED"
                }
                totalAmount={Number(
                  rental.totalAmount,
                ).toLocaleString()}
              />

              {rental.status ===
                "APPROVED" &&
                paymentComplete &&
                !hasOpenIssue && (
                  <ReportIssueForm
                    rentalId={
                      rental.id
                    }
                  />
                )}
            </div>
          )}

          {rental.status ===
            "CANCELLED" &&
            simulatedRefundComplete && (
              <div className="border-t border-zinc-100 px-6 py-6 md:px-7">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                  Refund completed.
                </div>
              </div>
            )}

          {[
            "REQUESTED",
            "APPROVED",
          ].includes(
            rental.status,
          ) &&
            !hasOpenIssue &&
            !paymentComplete &&
            !paymentStarted && (
              <div className="border-t border-zinc-100 px-6 py-5 md:px-7">
                <form
                  action={cancelRenterBooking.bind(
                    null,
                    rental.id,
                  )}
                >
                  <button
                    type="submit"
                    className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Cancel booking
                  </button>
                </form>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}

export default function RenterBookingPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-zinc-500">
          Loading booking...
        </div>
      }
    >
      <RenterBookingContent
        params={
          params
        }
      />
    </Suspense>
  );
}
