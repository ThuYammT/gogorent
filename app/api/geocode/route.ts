import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org";

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ??
  "GoGoRent-University-Project/1.0";

type SearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type ReverseResult = {
  display_name?: string;
  address?: {
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

function makeReadableLocation(
  data: ReverseResult,
) {
  const address =
    data.address;

  if (!address) {
    return (
      data.display_name ??
      "Selected location"
    );
  }

  const area =
    address.neighbourhood ??
    address.suburb ??
    address.city_district;

  const city =
    address.city ??
    address.town ??
    address.village;

  const parts = [
    area,
    city,
    address.state,
    address.country,
  ].filter(Boolean);

  const uniqueParts =
    [...new Set(parts)];

  return (
    uniqueParts.join(", ") ||
    data.display_name ||
    "Selected location"
  );
}

export async function GET(
  request: NextRequest,
) {
  const searchParams =
    request.nextUrl.searchParams;

  const type =
    searchParams.get("type");

  try {
    /* ======================================================
       SEARCH
    ====================================================== */

    if (type === "search") {
      const query =
        searchParams
          .get("q")
          ?.trim();

      if (!query) {
        return NextResponse.json(
          {
            error:
              "Search query is required.",
          },
          {
            status: 400,
          },
        );
      }

      const url =
        new URL(
          `${NOMINATIM_URL}/search`,
        );

      url.searchParams.set(
        "q",
        query,
      );

      url.searchParams.set(
        "format",
        "jsonv2",
      );

      url.searchParams.set(
        "limit",
        "5",
      );

      url.searchParams.set(
        "addressdetails",
        "1",
      );

      const response =
        await fetch(
          url.toString(),
          {
            headers: {
              "User-Agent":
                USER_AGENT,

              Accept:
                "application/json",
            },

            /*
             * Cache identical searches.
             * This also reduces unnecessary
             * requests to Nominatim.
             */
            next: {
              revalidate:
                86400,
            },
          },
        );

      if (!response.ok) {
        throw new Error(
          "Location search failed.",
        );
      }

      const data =
        (await response.json()) as SearchResult[];

      return NextResponse.json(
        data.map(
          (result) => ({
            latitude:
              Number(
                result.lat,
              ),

            longitude:
              Number(
                result.lon,
              ),

            location:
              result.display_name,
          }),
        ),
      );
    }

    /* ======================================================
       REVERSE GEOCODING
    ====================================================== */

    if (type === "reverse") {
      const latitude =
        Number(
          searchParams.get(
            "lat",
          ),
        );

      const longitude =
        Number(
          searchParams.get(
            "lon",
          ),
        );

      if (
        !Number.isFinite(
          latitude,
        ) ||
        !Number.isFinite(
          longitude,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Valid coordinates are required.",
          },
          {
            status: 400,
          },
        );
      }

      const url =
        new URL(
          `${NOMINATIM_URL}/reverse`,
        );

      url.searchParams.set(
        "lat",
        String(latitude),
      );

      url.searchParams.set(
        "lon",
        String(longitude),
      );

      url.searchParams.set(
        "format",
        "jsonv2",
      );

      url.searchParams.set(
        "addressdetails",
        "1",
      );

      const response =
        await fetch(
          url.toString(),
          {
            headers: {
              "User-Agent":
                USER_AGENT,

              Accept:
                "application/json",
            },

            next: {
              revalidate:
                86400,
            },
          },
        );

      if (!response.ok) {
        throw new Error(
          "Reverse geocoding failed.",
        );
      }

      const data =
        (await response.json()) as ReverseResult;

      return NextResponse.json({
        latitude,
        longitude,

        location:
          makeReadableLocation(
            data,
          ),

        fullAddress:
          data.display_name ??
          null,
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid geocoding request.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "Geocoding error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to retrieve location information.",
      },
      {
        status: 500,
      },
    );
  }
}