"use client";

import dynamic from "next/dynamic";

import {
  Crosshair,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

const DynamicMap =
  dynamic(
    () =>
      import(
        "./LocationPickerMap"
      ),
    {
      ssr: false,

      loading: () => (
        <div className="flex h-full items-center justify-center bg-zinc-100">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ),
    },
  );

type Coordinates = {
  latitude: number;
  longitude: number;
};

type SearchResult = {
  latitude: number;
  longitude: number;
  location: string;
};

type ReverseResult = {
  latitude: number;
  longitude: number;
  location: string;
  fullAddress?: string | null;
};

type LocationPickerProps = {
  initialLocation?: string | null;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
};

/*
 * Bangkok is only the initial map view.
 *
 * This is NOT saved unless the owner actually
 * selects a location.
 */
const DEFAULT_POSITION = {
  latitude: 13.7563,
  longitude: 100.5018,
};

export default function LocationPicker({
  initialLocation,
  initialLatitude,
  initialLongitude,
}: LocationPickerProps) {
  const hasExistingCoordinates =
    typeof initialLatitude ===
      "number" &&
    typeof initialLongitude ===
      "number";

  const [
    position,
    setPosition,
  ] = useState<Coordinates>(
    hasExistingCoordinates
      ? {
          latitude:
            initialLatitude!,
          longitude:
            initialLongitude!,
        }
      : DEFAULT_POSITION,
  );

  const [
    hasSelectedLocation,
    setHasSelectedLocation,
  ] =
    useState(
      hasExistingCoordinates,
    );

  const [
    location,
    setLocation,
  ] =
    useState(
      initialLocation ?? "",
    );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    searchResults,
    setSearchResults,
  ] =
    useState<
      SearchResult[]
    >([]);

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    locating,
    setLocating,
  ] = useState(false);

  const [
    resolving,
    setResolving,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  /*
   * Debounce reverse lookups so rapidly
   * clicking/dragging the map doesn't hammer
   * the free public geocoding service.
   */
  const reverseTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | undefined
    >(undefined);

  useEffect(() => {
    return () => {
      if (
        reverseTimer.current
      ) {
        clearTimeout(
          reverseTimer.current,
        );
      }
    };
  }, []);

  async function reverseGeocode(
    latitude: number,
    longitude: number,
  ) {
    setResolving(true);
    setError(null);

    try {
      const response =
        await fetch(
          `/api/geocode?type=reverse&lat=${encodeURIComponent(
            latitude,
          )}&lon=${encodeURIComponent(
            longitude,
          )}`,
        );

      if (!response.ok) {
        throw new Error();
      }

      const data =
        (await response.json()) as ReverseResult;

      setLocation(
        data.location,
      );

      setHasSelectedLocation(
        true,
      );
    } catch {
      /*
       * Coordinates are still valid even if
       * address lookup temporarily fails.
       */
      setLocation(
        `${latitude.toFixed(
          5,
        )}, ${longitude.toFixed(
          5,
        )}`,
      );

      setHasSelectedLocation(
        true,
      );

      setError(
        "The pin was saved, but the area name could not be loaded.",
      );
    } finally {
      setResolving(false);
    }
  }

  function selectCoordinates(
    latitude: number,
    longitude: number,
  ) {
    setPosition({
      latitude,
      longitude,
    });

    setHasSelectedLocation(
      true,
    );

    setSearchResults([]);

    if (
      reverseTimer.current
    ) {
      clearTimeout(
        reverseTimer.current,
      );
    }

    setResolving(true);

    reverseTimer.current =
      setTimeout(() => {
        void reverseGeocode(
          latitude,
          longitude,
        );
      }, 1100);
  }

  async function handleSearch() {
    const query =
      searchQuery.trim();

    if (!query) {
      return;
    }

    setSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const response =
        await fetch(
          `/api/geocode?type=search&q=${encodeURIComponent(
            query,
          )}`,
        );

      if (!response.ok) {
        throw new Error();
      }

      const data =
        (await response.json()) as SearchResult[];

      setSearchResults(
        data,
      );

      if (
        data.length === 0
      ) {
        setError(
          "No matching location was found.",
        );
      }
    } catch {
      setError(
        "Location search is temporarily unavailable.",
      );
    } finally {
      setSearching(false);
    }
  }

  function chooseSearchResult(
    result: SearchResult,
  ) {
    setPosition({
      latitude:
        result.latitude,

      longitude:
        result.longitude,
    });

    setLocation(
      result.location,
    );

    setHasSelectedLocation(
      true,
    );

    setSearchQuery(
      result.location,
    );

    setSearchResults([]);
    setError(null);
  }

  function useCurrentLocation() {
    if (
      !navigator.geolocation
    ) {
      setError(
        "Your browser does not support location services.",
      );

      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (currentPosition) => {
        const latitude =
          currentPosition
            .coords
            .latitude;

        const longitude =
          currentPosition
            .coords
            .longitude;

        setPosition({
          latitude,
          longitude,
        });

        setHasSelectedLocation(
          true,
        );

        setLocating(false);

        void reverseGeocode(
          latitude,
          longitude,
        );
      },

      () => {
        setLocating(false);

        setError(
          "We could not access your current location. You can still choose a point manually on the map.",
        );
      },

      {
        enableHighAccuracy:
          true,

        timeout: 10000,

        maximumAge:
          60000,
      },
    );
  }

  return (
    <div>
      {/* HIDDEN SERVER ACTION VALUES */}
      <input
        type="hidden"
        name="location"
        value={
          hasSelectedLocation
            ? location
            : ""
        }
      />

      <input
        type="hidden"
        name="latitude"
        value={
          hasSelectedLocation
            ? position.latitude
            : ""
        }
      />

      <input
        type="hidden"
        name="longitude"
        value={
          hasSelectedLocation
            ? position.longitude
            : ""
        }
      />

      {/* SEARCH */}
      <div>
        <label
          htmlFor="locationSearch"
          className="text-sm font-semibold text-zinc-800"
        >
          Search an area
        </label>

        <div className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

            <input
              id="locationSearch"
              type="text"
              value={searchQuery}
              onChange={(
                event,
              ) =>
                setSearchQuery(
                  event.target
                    .value,
                )
              }
              onKeyDown={(
                event,
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();

                  void handleSearch();
                }
              }}
              placeholder="e.g. Bang Na, Bangkok"
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              void handleSearch()
            }
            disabled={searching}
            className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}

            Search
          </button>
        </div>

        {/* SEARCH RESULTS */}
        {searchResults.length >
          0 && (
          <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
            {searchResults.map(
              (
                result,
                index,
              ) => (
                <button
                  key={`${result.latitude}-${result.longitude}-${index}`}
                  type="button"
                  onClick={() =>
                    chooseSearchResult(
                      result,
                    )
                  }
                  className="flex w-full items-start gap-3 border-b border-zinc-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-zinc-50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

                  <span className="text-sm leading-5 text-zinc-700">
                    {
                      result.location
                    }
                  </span>
                </button>
              ),
            )}
          </div>
        )}
      </div>

      {/* CURRENT LOCATION */}
      <button
        type="button"
        onClick={
          useCurrentLocation
        }
        disabled={locating}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
      >
        {locating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Crosshair className="h-4 w-4" />
        )}

        {locating
          ? "Finding your location..."
          : "Use my current location"}
      </button>

      {/* MAP */}
      <div className="relative mt-4 h-[390px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
        <DynamicMap
          position={position}
          onSelect={
            selectCoordinates
          }
        />

        {!hasSelectedLocation && (
          <div className="pointer-events-none absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-lg">
            Click the map to choose your pickup location
          </div>
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Click anywhere on the map or drag the pin to adjust the pickup point.
      </p>

      {/* SELECTED LOCATION */}
      <div
        className={`mt-4 rounded-2xl border p-4 ${
          hasSelectedLocation
            ? "border-amber-200 bg-amber-50/60"
            : "border-zinc-200 bg-zinc-50"
        }`}
      >
        <div className="flex gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              hasSelectedLocation
                ? "bg-amber-100"
                : "bg-zinc-200"
            }`}
          >
            <MapPin
              className={`h-5 w-5 ${
                hasSelectedLocation
                  ? "text-amber-600"
                  : "text-zinc-400"
              }`}
            />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Selected pickup area
            </p>

            {resolving ? (
              <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />

                Finding area name...
              </p>
            ) : hasSelectedLocation ? (
              <>
                <p className="mt-1 font-semibold leading-6 text-zinc-900">
                  {location ||
                    "Selected location"}
                </p>

                <p className="mt-2 text-xs text-zinc-400">
                  {position.latitude.toFixed(
                    6,
                  )}
                  ,{" "}
                  {position.longitude.toFixed(
                    6,
                  )}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">
                No pickup location selected yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}