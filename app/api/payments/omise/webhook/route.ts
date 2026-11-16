import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import {
  retrieveOmiseCharge,
} from "@/lib/omise";

import {
  syncPromptPayCharge,
} from "@/lib/promptpay-payment";

export const runtime =
  "nodejs";

function verifySignature(
  rawBody: string,
  signatureHeader: string,
  timestamp: string,
) {
  const secret =
    process.env
      .OMISE_WEBHOOK_SECRET;

  if (!secret) {
    return false;
  }

  const expected =
    createHmac(
      "sha256",

      Buffer.from(
        secret,
        "base64",
      ),
    )
      .update(
        `${timestamp}.${rawBody}`,
      )
      .digest();

  return signatureHeader
    .split(",")
    .some(
      (signature) => {
        const candidate =
          Buffer.from(
            signature.trim(),
            "hex",
          );

        return (
          candidate.length ===
            expected.length &&
          timingSafeEqual(
            candidate,
            expected,
          )
        );
      },
    );
}

export async function POST(
  request: Request,
) {
  const rawBody =
    await request.text();

  const signature =
    request.headers.get(
      "omise-signature",
    );

  const timestamp =
    request.headers.get(
      "omise-signature-timestamp",
    );

  if (
    !signature ||
    !timestamp ||
    !verifySignature(
      rawBody,
      signature,
      timestamp,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid webhook signature.",
      },
      {
        status: 401,
      },
    );
  }

  /*
   * Optional replay protection.
   */
  const timestampMs =
    Number(
      timestamp,
    ) * 1000;

  if (
    !Number.isFinite(
      timestampMs,
    ) ||
    Math.abs(
      Date.now() -
        timestampMs,
    ) >
      5 * 60 * 1000
  ) {
    return NextResponse.json(
      {
        error:
          "Webhook timestamp is outside the allowed window.",
      },
      {
        status: 401,
      },
    );
  }

  const event =
    JSON.parse(
      rawBody,
    ) as {
      key?: string;

      data?: {
        id?: string;
      };
    };

  if (
    event.key !==
      "charge.complete" ||
    !event.data?.id
  ) {
    return NextResponse.json({
      received:
        true,
    });
  }

  /*
   * Do not trust the webhook's charge object alone.
   * Retrieve the real charge directly from Omise.
   */
  const charge =
    await retrieveOmiseCharge(
      event.data.id,
    );

  await syncPromptPayCharge(
    charge,
  );

  return NextResponse.json({
    received:
      true,
  });
}