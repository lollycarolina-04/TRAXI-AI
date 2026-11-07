
"use client";

import { useEffect, useState } from "react";

import TomTomMap from "../components/TomTomMap";
import BackendStatus from "../components/BackendStatus";
import RouteForm, { type RouteInput } from "../components/RouteForm";

type WeatherData = {
  temperature_2m: number;
  relative_humidity_2m: number;
  precipitation: number;
  wind_speed_10m: number;
  weather_code?: number;
};

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<RouteInput | null>(null);

  // AI INPUT
  const [kecepatan] = useState("18");
  const [kendaraan] = useState("130");
  const [prediksi, setPrediksi] = useState("");

  // WEATHER
  const [cuaca, setCuaca] = useState<WeatherData | null>(null);
  const [cuacaError, setCuacaError] = useState("");

  // LOADING
  const [isPredicting, setIsPredicting] = useState(false);

  // ROUTE DISTANCE
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState("");

  // ==========================================
  // GET WEATHER DATA
  // ==========================================
  useEffect(() => {
    async function ambilCuaca() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/weather`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error("Weather data is unavailable");
        }

        setCuaca(result.cuaca);
        setCuacaError("");
      } catch (error) {
        console.error("Failed to get weather:", error);
        setCuacaError("Weather data is not available yet.");
      }
    }

    ambilCuaca();
  }, []);

  // ==========================================
  // GET ROUTE DISTANCE FROM TOMTOM
  // ==========================================
  useEffect(() => {
    if (!selectedRoute) {
      setRouteDistance(null);
      setDistanceError("");
      return;
    }

    let cancelled = false;

    async function getRouteDistance() {
      const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

      if (!apiKey) {
        setDistanceError("TomTom API key is unavailable.");
        return;
      }

      setDistanceLoading(true);
      setDistanceError("");
      setRouteDistance(null);

      try {
        const {
          originLat,
          originLon,
          destinationLat,
          destinationLon,
        } = selectedRoute!;

        const url =
          `https://api.tomtom.com/routing/1/calculateRoute/` +
          `${originLat},${originLon}:${destinationLat},${destinationLon}/json` +
          `?key=${apiKey}&travelMode=car`;

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok || !result.routes?.length) {
          throw new Error("Unable to calculate route distance.");
        }

        if (cancelled) return;

        const distanceInMeters =
          result.routes[0].summary.lengthInMeters;

        setRouteDistance(distanceInMeters / 1000);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to get route distance:", error);
        setDistanceError("Route distance is unavailable.");
      } finally {
        if (!cancelled) {
          setDistanceLoading(false);
        }
      }
    }

    getRouteDistance();

    return () => {
      cancelled = true;
    };
  }, [selectedRoute]);

  // ==========================================
  // ROUTE SUBMISSION + AI PREDICTION
  // ==========================================
  async function handleRouteSubmit(route: RouteInput) {
    if (isPredicting) return;

    setSelectedRoute(route);
    setPrediksi("");
    setIsPredicting(true);

    try {
      // STEP 1: SEND ROUTE TO BACKEND
      const routeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/route`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: route.origin,
            destination: route.destination,
          }),
        }
      );

      const routeResult = await routeResponse.json();

      if (!routeResponse.ok || !routeResult.success) {
        throw new Error(
          routeResult.message || "Failed to send route"
        );
      }

      // STEP 2: DETERMINE WEATHER CONDITION
      const kondisiCuaca =
        cuaca?.weather_code === 0
          ? "cerah"
          : (cuaca?.precipitation ?? 0) > 0
            ? "hujan ringan"
            : "berawan";

      // STEP 3: SEND INPUT TO AI
      const predictionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kecepatan: Number(kecepatan),
            kendaraan: Number(kendaraan),
            cuaca: kondisiCuaca,
          }),
        }
      );

      const predictionResult = await predictionResponse.json();

      if (!predictionResponse.ok || !predictionResult.success) {
        throw new Error(
          predictionResult.message || "Prediction failed"
        );
      }

      // STEP 4: DISPLAY PREDICTION
      setPrediksi(predictionResult.prediksi);
    } catch (error) {
      console.error("Route or prediction failed:", error);

      setPrediksi(
        "Prediction failed. Please check the backend connection."
      );
    } finally {
      setIsPredicting(false);
    }
  }

  // ==========================================
  // MAIN DASHBOARD
  // ==========================================
  return (
    <main className="min-h-screen bg-[#F5FAFA] text-slate-800">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-60 flex-col border-r border-teal-100 bg-white px-5 py-8 lg:flex">
        <a href="#" className="mb-12 block px-3">
          <div className="text-3xl font-extrabold tracking-wider text-teal-700">
            〽 TRAXI
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Smarter Route. Smoother Journey.
          </p>
        </a>

        <nav className="space-y-3">
          <a
            href="#home"
            className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3 font-semibold text-teal-800"
          >
            <span>⌂</span> Home
          </a>

          <a
            href="#traffic"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
          >
            <span>▥</span> Traffic Details
          </a>

          <a
            href="#about"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-teal-50 hover:text-teal-700"
          >
            <span>ⓘ</span> About
          </a>
        </nav>

        <div className="mt-auto rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
          <p className="font-semibold text-teal-900">
            Travel smarter!
          </p>

          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Check traffic conditions before you start your journey.
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="lg:ml-60">

        {/* HERO HEADER */}
        <header
          id="home"
          className="relative overflow-hidden bg-gradient-to-r from-[#DDF5F2] via-[#EFFBFA] to-[#D9F2F6] px-6 py-9 md:px-10"
        >
          <div className="relative z-10">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal-700">
              Smart Traffic Prediction
            </p>

            <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-[#15384A] md:text-5xl">
              Smarter Route,
              <br />
              Smoother Journey.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 md:text-base">
              Predict traffic, plan better, and reach your destination on time.
            </p>
          </div>

          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="absolute -bottom-28 right-1/4 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />

          <div className="relative z-10 mt-6 inline-flex items-center gap-2 rounded-full border border-white bg-white/80 px-4 py-2 text-sm font-medium text-teal-800 shadow-sm">
            <span>📍</span> Batam, Indonesia
          </div>
        </header>

        {/* DASHBOARD */}
        <section className="space-y-6 px-5 py-7 md:px-8">

          {/* ROUTE PLANNER */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="text-2xl text-teal-600">⌁</span>

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Plan Your Route
                </h2>

                <p className="text-sm text-slate-500">
                  Enter your starting point and destination.
                </p>
              </div>
            </div>

            <RouteForm onSubmit={handleRouteSubmit} />
          </div>

          {/* TRAFFIC ANALYSIS + MAP */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">

            {/* TRAFFIC ANALYSIS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-5 flex items-center gap-3">
                <span className="text-2xl text-teal-600">▥</span>

                <h2 className="text-lg font-bold">
                  Traffic Analysis
                </h2>
              </div>

              {/* SELECTED ROUTE */}
              <div className="rounded-xl border border-teal-100 bg-[#EAF8F6] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>

                  <p className="text-sm font-semibold text-teal-900">
                    Selected Route
                  </p>
                </div>

                {selectedRoute ? (
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        Starting Point
                      </p>

                      <p className="text-sm font-semibold text-slate-800">
                        {selectedRoute.origin}
                      </p>
                    </div>

                    <div className="border-t border-teal-100 pt-2">
                      <p className="text-xs text-slate-500">
                        Destination
                      </p>

                      <p className="text-sm font-semibold text-slate-800">
                        {selectedRoute.destination}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Select your starting point and destination first.
                  </p>
                )}

                <div className="mt-4 border-t border-teal-100 pt-3">
                  <p className="text-xs font-medium text-slate-500">
                    TOTAL ROUTE DISTANCE
                  </p>

                  <p className="mt-1 text-2xl font-extrabold text-teal-800">
                    {distanceLoading
                      ? "Calculating..."
                      : routeDistance !== null
                        ? `${routeDistance.toFixed(2)} km`
                        : "-- km"}
                  </p>

                  {distanceError && (
                    <p className="mt-1 text-xs text-red-500">
                      {distanceError}
                    </p>
                  )}
                </div>
              </div>

              {/* TRAFFIC METRICS */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="mb-2 text-lg">🚗</div>

                  <p className="text-xs text-slate-500">
                    Average Speed
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {kecepatan} km/h
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="mb-2 text-lg">🚙</div>

                  <p className="text-xs text-slate-500">
                    Vehicle Volume
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {kendaraan} / hour
                  </p>
                </div>
              </div>

              {/* AI PREDICTION */}
              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  AI Traffic Prediction
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xl font-extrabold text-slate-800">
                    {isPredicting
                      ? "Analyzing..."
                      : prediksi || "Not available"}
                  </p>

                  {prediksi &&
                    !prediksi.toLowerCase().includes("failed") && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        AI Result
                      </span>
                    )}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Predicted traffic condition based on the AI model.
                </p>
              </div>

              {/* WEATHER INFORMATION */}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h3 className="mb-4 font-semibold text-slate-800">
                  Weather Information
                </h3>

                {cuacaError ? (
                  <p className="text-sm text-red-600">
                    {cuacaError}
                  </p>
                ) : cuaca ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Temperature
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {cuaca.temperature_2m} °C
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Humidity
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {cuaca.relative_humidity_2m}%
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Rainfall
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {cuaca.precipitation} mm
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Wind Speed
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {cuaca.wind_speed_10m} km/h
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Loading weather data...
                  </p>
                )}

                <p className="mt-3 text-xs text-slate-400">
                  Weather data: Open-Meteo
                </p>
              </div>
            </div>

            {/* TOMTOM MAP */}
            <div
              id="map"
              className="min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-bold text-slate-800">
                  Batam Traffic Map
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  View your selected route on the map.
                </p>
              </div>

              <div className="min-h-[380px]">
                <TomTomMap route={selectedRoute} />
              </div>
            </div>
          </div>

          {/* TRAFFIC INFORMATION */}
          <div
            id="traffic"
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">
                Traffic Insights
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                TRAXI uses traffic data and AI prediction to help users
                understand road conditions in Batam.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <span className="text-xl">🟢</span>
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Smooth
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-3">
                  <span className="text-xl">🟡</span>
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Moderate
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-3">
                  <span className="text-xl">🔴</span>
                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Heavy
                  </p>
                </div>
              </div>
            </div>

            {/* ABOUT TRAXI */}
            <div
              id="about"
              className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold text-teal-900">
                About TRAXI
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                TRAXI is an AI-powered traffic prediction application
                designed to help people plan their journeys in Batam.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Enter your route, check traffic information, and make
                better travel decisions.
              </p>
            </div>
          </div>

          {/* BACKEND STATUS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <BackendStatus />
          </div>

          {/* FOOTER */}
          <footer className="pb-5 pt-2 text-center text-xs text-slate-400">
            © 2026 TRAXI · Smarter Route. Smoother Journey.
          </footer>

        </section>
      </div>
    </main>
  );
}
