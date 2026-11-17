import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

import {
  getSession,
} from "@/lib/session";

const RECEIPT_BUCKET =
  "settlement-receipts";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      transactionId: string;
    }>;
  },
) {
  const session =
    await getSession();

  if (!session) {
    return new NextResponse(
      "Unauthorized",
      {
        status: 401,
      },
    );
  }

  const {
    transactionId,
  } = await params;

  const transaction =
    await prisma.transaction.findUnique({
      where: {
        id:
          transactionId,
      },

      select: {
        id: true,
        type: true,
        status: true,
        receiptPath: true,

        rental: {
          select: {
            renterId: true,
            ownerId: true,
          },
        },
      },
    });

  if (
    !transaction ||
    !transaction.receiptPath ||
    transaction.status !==
      "COMPLETED"
  ) {
    return new NextResponse(
      "Receipt not found",
      {
        status: 404,
      },
    );
  }

  /*
   * Only these two transaction types
   * can expose admin transfer proof.
   */
  if (
    transaction.type !==
      "DEPOSIT_REFUND" &&
    transaction.type !==
      "OWNER_PAYOUT"
  ) {
    return new NextResponse(
      "Receipt not found",
      {
        status: 404,
      },
    );
  }

  const isAdmin =
    session.role ===
    "ADMIN";

  const isRenter =
    session.role ===
      "RENTER" &&
    transaction.rental
      .renterId ===
      session.userId &&
    transaction.type ===
      "DEPOSIT_REFUND";

  const isOwner =
    session.role ===
      "OWNER" &&
    transaction.rental
      .ownerId ===
      session.userId &&
    transaction.type ===
      "OWNER_PAYOUT";

  if (
    !isAdmin &&
    !isRenter &&
    !isOwner
  ) {
    return new NextResponse(
      "Forbidden",
      {
        status: 403,
      },
    );
  }

  const {
    supabaseAdmin,
  } = await import(
    "@/lib/supabase-admin"
  );

  const {
    data,
    error,
  } =
    await supabaseAdmin.storage
      .from(
        RECEIPT_BUCKET,
      )
      .download(
        transaction.receiptPath,
      );

  if (
    error ||
    !data
  ) {
    console.error(
      "Settlement receipt download failed:",
      error?.message,
    );

    return new NextResponse(
      "Receipt unavailable",
      {
        status: 404,
      },
    );
  }

  const buffer =
    await data.arrayBuffer();

  return new NextResponse(
    buffer,
    {
      status: 200,

      headers: {
        "Content-Type":
          data.type ||
          "application/octet-stream",

        "Content-Disposition":
          `inline; filename="gogorent-settlement-receipt"`,

        "Cache-Control":
          "private, no-store, max-age=0",

        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}