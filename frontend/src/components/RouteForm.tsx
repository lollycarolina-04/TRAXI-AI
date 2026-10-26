
"use client";

import { useState } from "react";

export type RouteInput = {
  origin: string;
  destination: string;
};

type RouteFormProps = {
  onSubmit: (route: RouteInput) => void;
};

export default function RouteForm({ onSubmit }: RouteFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!origin.trim() || !destination.trim()) {
      return;
    }

    onSubmit({
      origin: origin.trim(),
      destination: destination.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold">Rencanakan Perjalanan</h2>
      <p className="mt-1 text-sm text-gray-500">
        Masukkan lokasi awal dan tujuan di Kota Batam.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            Lokasi awal
          </span>
          <input
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
            placeholder="Contoh: Simpang Kepri Mall"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-teal-600"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium">
            Lokasi tujuan
          </span>
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Contoh: Batamindo Industrial Park"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-teal-600"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-4 rounded-lg bg-teal-700 px-5 py-3 font-medium text-white transition hover:bg-teal-800"
      >
        Periksa Perjalanan
      </button>
    </form>
  );
}
