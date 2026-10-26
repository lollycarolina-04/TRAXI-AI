
"use client";

import { useEffect, useRef } from "react";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapRoute = {
  origin: string;
  destination: string;
};

type TomTomMapProps = {
  route?: MapRoute | null;
};

export default function TomTomMap({ route = null }: TomTomMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const routingRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

      if (!apiKey || !containerRef.current || cancelled) return;

      setWorkerUrl("/tomtom/maplibre-gl-worker.mjs");

      const { TomTomMap: TomTomMapSDK, RoutingModule } =
        await import("@tomtom-org/maps-sdk/map");

      const { TomTomConfig } = await import("@tomtom-org/maps-sdk/core");

      TomTomConfig.instance.put({ apiKey });

      if (cancelled || !containerRef.current) return;

      const map = new TomTomMapSDK({
        apiKey,
        mapLibre: {
          container: containerRef.current,
          center: [104.0305, 1.1301],
          zoom: 11,
        },
      });

      mapRef.current = map;
      routingRef.current = await RoutingModule.create(map);

      if (cancelled) {
        map.mapLibreMap.remove();
        mapRef.current = null;
        routingRef.current = null;
      }
    }

    initializeMap().catch((error) => {
      console.error("Gagal memuat peta TomTom:", error);
    });

    return () => {
      cancelled = true;
      mapRef.current?.mapLibreMap.remove();
      mapRef.current = null;
      routingRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!route || !routingRef.current) return;

    let cancelled = false;

    async function drawRoute() {
      try {
        const { geocodeOne, calculateRoute } = await import(
          "@tomtom-org/maps-sdk/services"
        );

        const locations = await Promise.all([
          geocodeOne(`${route!.origin}, Batam, Indonesia`),
          geocodeOne(`${route!.destination}, Batam, Indonesia`),
        ]);

        if (cancelled) return;

        const routes = await calculateRoute({
          locations,
          costModel: { traffic: "historical" },
        });

        if (cancelled) return;

        await routingRef.current.showRoutes(routes);
        await routingRef.current.showWaypoints(locations);
      } catch (error) {
        console.error("Gagal mencari rute:", error);
        window.alert(
          "Rute belum berhasil ditemukan. Periksa nama lokasi dan coba lagi."
        );
      }
    }

    drawRoute();

    return () => {
      cancelled = true;
    };
  }, [route]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "500px" }}
    />
  );
}
