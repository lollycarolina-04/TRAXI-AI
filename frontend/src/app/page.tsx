
"use client";

import TomTomMap from "../components/TomTomMap";
import BackendStatus from "../components/BackendStatus";
import { useEffect, useState } from "react";
import RouteForm, { type RouteInput } from "../components/RouteForm";

export default function Home() {
  const [selectedRoute, setSelectedRoute] = useState<RouteInput | null>(null);
  const [routeStatus, setRouteStatus] = useState("");
  const [kecepatan, setKecepatan] = useState("18");
  const [kendaraan, setKendaraan] = useState("130");
  const [prediksi, setPrediksi] = useState("");
  const [routeError, setRouteError] = useState(false);
  const [cuaca, setCuaca] = useState<any>(null);
  const [cuacaError, setCuacaError] = useState("");

  useEffect(() => {
    async function ambilCuaca() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/weather`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error("Data cuaca tidak tersedia");
        }

        setCuaca(result.cuaca);
        setCuacaError("");
      } catch (error) {
        console.error("Gagal mengambil cuaca:", error);
        setCuacaError("Data cuaca belum dapat dimuat.");
      }
    }

    ambilCuaca();
  }, []);

  async function handlePredict() {
    setPrediksi("Sedang memproses prediksi...");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kecepatan: Number(kecepatan),
            kendaraan: Number(kendaraan),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Prediksi gagal");
      }

      setPrediksi(result.prediksi);
    } catch (error) {
      console.error("Gagal melakukan prediksi:", error);
      setPrediksi("Prediksi gagal. Periksa koneksi backend.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-gray-900">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-teal-700">
              TRAXI
            </h1>
            <p className="text-sm text-gray-500">
              Prediksi Kemacetan Kota Batam
            </p>
          </div>

          <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
            Smart Traffic
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            Pantau Kondisi Lalu Lintas
          </h2>
          <p className="mt-2 text-gray-600">
            Lihat peta Kota Batam sebagai langkah awal menuju prediksi
            kemacetan yang lebih cerdas.
          </p>
        </div>

        {/* Panel cuaca */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            Cuaca Kota Batam
          </h3>

          {cuacaError ? (
            <p className="mt-3 text-sm text-red-600">{cuacaError}</p>
          ) : cuaca ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">Suhu</p>
                <p className="mt-1 text-xl font-semibold">
                  {cuaca.temperature_2m} °C
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Kelembapan</p>
                <p className="mt-1 text-xl font-semibold">
                  {cuaca.relative_humidity_2m}%
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Curah hujan</p>
                <p className="mt-1 text-xl font-semibold">
                  {cuaca.precipitation} mm
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Kecepatan angin</p>
                <p className="mt-1 text-xl font-semibold">
                  {cuaca.wind_speed_10m} km/jam
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Memuat data cuaca...
            </p>
          )}

          <p className="mt-4 text-xs text-gray-400">
            Sumber data: Open-Meteo
          </p>
        </div>

        {/* Panel prediksi AI */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">
            Prediksi Kemacetan
          </h3>

          <button
            type="button"
            onClick={handlePredict}
            className="mt-4 rounded-lg bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800"
          >
            Prediksi Kemacetan
          </button>

          {prediksi && (
            <div
              className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4"
              role="status"
            >
              <p className="text-sm text-teal-800">Hasil prediksi AI</p>
              <p className="mt-1 text-lg font-semibold text-teal-900">
                {prediksi}
              </p>
            </div>
          )}
        </div>

        {/* Form rute */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">
            Pilih Rute Perjalanan
          </h3>

          <RouteForm
            onSubmit={async (route) => {
              setSelectedRoute(route);
              setRouteStatus("Mengirim rute ke backend...");
              setRouteError(false);

              try {
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/route`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(route),
                  }
                );

                const result = await response.json();

                if (!response.ok || !result.success) {
                  throw new Error(result.message || "Gagal mengirim rute");
                }

                setRouteStatus("Rute berhasil dikirim ke backend TRAXI!");
              } catch (error) {
                console.error("Gagal mengirim rute:", error);
                setRouteStatus(
                  "Gagal menghubungi backend. Pastikan Flask sedang berjalan."
                );
                setRouteError(true);
              }
            }}
          />

          {routeStatus && (
            <div
              className={`mt-4 rounded-lg border p-4 text-sm ${
                routeError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-teal-200 bg-teal-50 text-teal-800"
              }`}
              role="status"
            >
              {routeStatus}
            </div>
          )}

          {selectedRoute && (
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="font-medium">Rute yang dimasukkan</p>
              <p className="mt-2 text-sm">
                Awal: {selectedRoute.origin}
              </p>
              <p className="text-sm">
                Tujuan: {selectedRoute.destination}
              </p>
            </div>
          )}
        </div>

        {/* Peta TomTom */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <TomTomMap route={selectedRoute} />
        </div>

        <p className="mt-3 text-sm text-gray-500">
          Peta berpusat di sekitar Kota Batam.
        </p>

        <BackendStatus />
      </section>
    </main>
  );
}
