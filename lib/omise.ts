const OMISE_API = "https://api.omise.co";

export type OmiseCharge = {
  id: string;
  amount: number;
  currency: string;
  status:
    | "pending"
    | "successful"
    | "failed"
    | "expired"
    | "reversed";
  paid: boolean;
  expires_at: string | null;
  failure_code: string | null;
  failure_message: string | null;

  metadata?: Record<string, unknown> | null;

  source?: {
    scannable_code?: {
      image?: {
        download_uri?: string | null;
      } | null;
    } | null;
  } | null;
};

function secretKey() {
  const key =
    process.env.OMISE_SECRET_KEY;

  if (!key) {
    throw new Error(
      "OMISE_SECRET_KEY is not configured.",
    );
  }

  return key;
}

function authorizationHeader() {
  return `Basic ${Buffer.from(
    `${secretKey()}:`,
  ).toString("base64")}`;
}

async function omiseRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${OMISE_API}${path}`,
    {
      ...init,

      headers: {
        Authorization:
          authorizationHeader(),

        ...(init?.headers ?? {}),
      },

      cache: "no-store",
    },
  );

  const data =
    (await response.json()) as T & {
      message?: string;
      code?: string;
    };

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.code ||
        "Omise request failed.",
    );
  }

  return data;
}

export async function createPromptPayCharge(
  input: {
    amountSatang: number;
    rentalId: string;
    description: string;
  },
) {
  const expiresAt =
    new Date(
      Date.now() +
        10 * 60 * 1000,
    ).toISOString();

  const body =
    new URLSearchParams();

  body.set(
    "amount",
    String(input.amountSatang),
  );

  body.set(
    "currency",
    "THB",
  );

  body.set(
    "source[type]",
    "promptpay",
  );

  body.set(
    "description",
    input.description,
  );

  body.set(
    "expires_at",
    expiresAt,
  );

  body.set(
    "metadata[rentalId]",
    input.rentalId,
  );

  return omiseRequest<OmiseCharge>(
    "/charges",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },

      body,
    },
  );
}

export async function retrieveOmiseCharge(
  chargeId: string,
) {
  return omiseRequest<OmiseCharge>(
    `/charges/${encodeURIComponent(
      chargeId,
    )}`,
  );
}

export function promptPayQrUrl(
  charge: OmiseCharge,
) {
  return (
    charge.source
      ?.scannable_code
      ?.image
      ?.download_uri ??
    null
  );
}