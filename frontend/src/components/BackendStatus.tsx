
"use client";

import { useEffect, useState } from "react";

type ConnectionResult = {
  success: boolean;
  message: string;
};

export default function BackendStatus() {
  const [message, setMessage] = useState("Memeriksa koneksi...");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "http://127.0.0.1:5000";

        const response = await fetch(
          `${baseUrl}/api/test-connection`
        );

        if (!response.ok) {
          throw new Error("Backend memberikan respons error");
        }

        const data: ConnectionResult = await response.json();

        setConnected(data.success);
        setMessage(data.message);
      } catch {
        setConnected(false);
        setMessage("Backend belum dapat dihubungi");
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span
          className={`h-3 w-3 rounded-full ${
            connected ? "bg-green-500" : "bg-amber-500"
          }`}
        />
        <p className="font-medium">
          Status Backend: {connected ? "Terhubung" : "Memeriksa"}
        </p>
      </div>

      <p className="mt-2 text-sm text-gray-600">{message}</p>
    </div>
  );
}
