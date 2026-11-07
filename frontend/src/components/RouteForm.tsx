
"use client";

import { useEffect, useState } from "react";

export type RouteInput = {
  origin: string;
  destination: string;
  originLat: number;
  originLon: number;
  destinationLat: number;
  destinationLon: number;
};

type RouteFormProps = {
  onSubmit: (route: RouteInput) => void;
};

type LocationResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
};

// Check whether a location belongs to Batam City
function isBatamLocation(address: any): boolean {
  if (!address) return false;

  const countryCode = (address.countryCode || "").toUpperCase();

  const administrativeAreas = [
    address.municipality,
    address.municipalitySubdivision,
    address.countrySecondarySubdivision,
    address.countryTertiarySubdivision,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    (countryCode === "ID" || countryCode === "IDN") &&
    administrativeAreas.includes("batam")
  );
}

// Convert TomTom search results into location data
function formatLocationResults(results: any[]): LocationResult[] {
  return results
    .filter((item: any) => isBatamLocation(item.address))
    .map((item: any) => ({
      id: item.id,
      name:
        item.poi?.name ||
        item.address?.freeformAddress ||
        "Unknown location",
      address: item.address?.freeformAddress || "",
      lat: item.position.lat,
      lon: item.position.lon,
    }));
}

export default function RouteForm({ onSubmit }: RouteFormProps) {
  // Location names
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  // Location coordinates
  const [originCoordinates, setOriginCoordinates] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const [destinationCoordinates, setDestinationCoordinates] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  // Starting point suggestions
  const [originSuggestions, setOriginSuggestions] = useState<LocationResult[]>([]);
  const [loadingOriginSuggestions, setLoadingOriginSuggestions] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [originSelected, setOriginSelected] = useState(false);

  // Destination suggestions
  const [suggestions, setSuggestions] = useState<LocationResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [destinationSelected, setDestinationSelected] = useState(false);

  // GPS loading
  const [locationLoading, setLocationLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

  // Detect GPS and convert coordinates into a location name
  useEffect(() => {
    if (!navigator.geolocation || !apiKey) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?key=${apiKey}&language=id-ID`
          );

          if (!response.ok) {
            throw new Error("Failed to get location name.");
          }

          const data = await response.json();
          console.log("TomTom location data:", data.results);
          const result = data.results?.[0];

          if (!result) {
            setOrigin("");
            setOriginCoordinates(null);
            setOriginSelected(false);
            return;
          }

          if (!isBatamLocation(result.address)) {
            window.alert(
              "Your current location is outside Batam City. TRAXI only supports locations within Batam City."
            );

            setOrigin("");
            setOriginCoordinates(null);
            setOriginSelected(false);
            return;
          }

          setOrigin(
            result.address?.freeformAddress ||
            result.address?.municipality ||
            "Current Location"
          );

          setOriginCoordinates({
            lat: latitude,
            lon: longitude,
          });

          setOriginSelected(true);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setOrigin("");
          setOriginCoordinates(null);
          setOriginSelected(false);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        setLocationLoading(false);
      }
    );
  }, [apiKey]);

  // Search starting point suggestions while typing
  useEffect(() => {
    if (
      !apiKey ||
      originSelected ||
      origin.trim().length < 2
    ) {
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoadingOriginSuggestions(true);

      try {
        const query = encodeURIComponent(origin.trim());

        const response = await fetch(
          `https://api.tomtom.com/search/2/search/${query}.json?key=${apiKey}&typeahead=true&limit=5&countrySet=ID&lat=1.13&lon=104.03&language=id-ID`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Starting point search failed.");
        }

        const data = await response.json();
        const rawResults = data.results || [];
        const results = formatLocationResults(rawResults);

        setOriginSuggestions(results);
        setShowOriginSuggestions(results.length > 0);

        if (rawResults.length > 0 && results.length === 0) {
          window.alert(
            "This location is outside Batam City. TRAXI only supports locations within Batam City."
          );
        } else if (rawResults.length === 0) {
          window.alert(
            "Location not found. Please enter a valid location."
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Starting point search error:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingOriginSuggestions(false);
        }
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [origin, apiKey, originSelected]);

  // Search destination suggestions while typing
  useEffect(() => {
    if (
      !apiKey ||
      destinationSelected ||
      destination.trim().length < 2
    ) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);

      try {
        const query = encodeURIComponent(destination.trim());

        const response = await fetch(
          `https://api.tomtom.com/search/2/search/${query}.json?key=${apiKey}&typeahead=true&limit=5&countrySet=ID&lat=1.13&lon=104.03&language=id-ID`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Destination search failed.");
        }

        const data = await response.json();
        const rawResults = data.results || [];
        const results = formatLocationResults(rawResults);

        setSuggestions(results);
        setShowSuggestions(results.length > 0);

        if (rawResults.length > 0 && results.length === 0) {
          window.alert(
            "This location is outside Batam City. TRAXI only supports locations within Batam City."
          );
        } else if (rawResults.length === 0) {
          window.alert(
            "Location not found. Please enter a valid location."
          );
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Destination search error:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSuggestions(false);
        }
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination, apiKey, destinationSelected]);

  // Submit route
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !origin.trim() ||
      !destination.trim() ||
      !originCoordinates ||
      !destinationCoordinates
    ) {
      window.alert(
        "Please select both locations from the search suggestions."
      );
      return;
    }

    onSubmit({
      origin: origin.trim(),
      destination: destination.trim(),
      originLat: originCoordinates.lat,
      originLon: originCoordinates.lon,
      destinationLat: destinationCoordinates.lat,
      destinationLon: destinationCoordinates.lon,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="mt-4 grid gap-4 md:grid-cols-2">

        {/* Starting Point */}
        <div className="relative">
          <label className="mb-2 block text-sm font-medium">
            Starting Point
          </label>

          <input
            value={origin}
            onChange={(event) => {
              setOrigin(event.target.value);
              setOriginCoordinates(null);
              setOriginSelected(false);
            }}
            onFocus={() => {
              if (!originSelected && originSuggestions.length > 0) {
                setShowOriginSuggestions(true);
              }
            }}
            placeholder={
              locationLoading
                ? "Detecting your location..."
                : "Enter your starting point"
            }
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-teal-600"
            autoComplete="off"
            required
          />

          {loadingOriginSuggestions && (
            <p className="mt-1 text-xs text-gray-500">
              Searching locations...
            </p>
          )}

          {showOriginSuggestions && originSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {originSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOrigin(item.name);
                    setOriginCoordinates({
                      lat: item.lat,
                      lon: item.lon,
                    });
                    setOriginSelected(true);
                    setShowOriginSuggestions(false);
                    setOriginSuggestions([]);
                  }}
                  className="block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-teal-50"
                >
                  <span className="block text-sm font-medium text-gray-800">
                    {item.name}
                  </span>

                  <span className="block text-xs text-gray-500">
                    {item.address}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="relative">
          <label className="mb-2 block text-sm font-medium">
            Destination
          </label>

          <input
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
              setDestinationCoordinates(null);
              setDestinationSelected(false);
            }}
            onFocus={() => {
              if (!destinationSelected && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Enter your destination"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-teal-600"
            autoComplete="off"
            required
          />

          {loadingSuggestions && (
            <p className="mt-1 text-xs text-gray-500">
              Searching locations...
            </p>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDestination(item.name);
                    setDestinationCoordinates({
                      lat: item.lat,
                      lon: item.lon,
                    });
                    setDestinationSelected(true);
                    setShowSuggestions(false);
                    setSuggestions([]);
                  }}
                  className="block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-teal-50"
                >
                  <span className="block text-sm font-medium text-gray-800">
                    {item.name}
                  </span>

                  <span className="block text-xs text-gray-500">
                    {item.address}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="mt-4 rounded-lg bg-teal-700 px-5 py-3 font-medium text-white transition hover:bg-teal-800"
      >
        Check Route
      </button>
    </form>
  );
}
