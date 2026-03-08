"use client";

import { useRef, useCallback } from "react";
import Map, {
  Source,
  Layer,
  MapRef,
  MapMouseEvent,
} from "react-map-gl/mapbox";
import type { LayerProps } from "react-map-gl/mapbox";
import type { DisasterGeoJSON, DisasterFeature } from "@/lib/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const circleLayer: LayerProps = {
  id: "disaster-circles",
  type: "circle",
  paint: {
    "circle-color": [
      "match",
      ["get", "alertLevel"],
      "Red",
      "#ef4444",
      "Orange",
      "#f97316",
      "Green",
      "#22c55e",
      "#94a3b8",
    ],
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "severity"],
      0, 6,
      0.5, 8,
      1.5, 14,
      2.5, 26,
    ],
    "circle-opacity": 0.85,
    "circle-stroke-width": 2,
    "circle-stroke-color": [
      "match",
      ["get", "alertLevel"],
      "Red",
      "#fca5a5",
      "Orange",
      "#fdba74",
      "Green",
      "#86efac",
      "#cbd5e1",
    ],
    "circle-stroke-opacity": 0.6,
  },
};

const glowLayer: LayerProps = {
  id: "disaster-glow",
  type: "circle",
  paint: {
    "circle-color": [
      "match",
      ["get", "alertLevel"],
      "Red",
      "#ef4444",
      "Orange",
      "#f97316",
      "Green",
      "#22c55e",
      "#94a3b8",
    ],
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "severity"],
      0, 15,
      0.5, 18,
      1.5, 28,
      2.5, 55,
    ],
    "circle-opacity": 0.15,
    "circle-blur": 1,
  },
};

interface DisasterMapProps {
  data: DisasterGeoJSON;
  onSelectDisaster: (feature: DisasterFeature | null) => void;
}

export default function DisasterMap({
  data,
  onSelectDisaster,
}: DisasterMapProps) {
  const mapRef = useRef<MapRef>(null);

  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      const features = event.features;
      if (!features || features.length === 0) {
        onSelectDisaster(null);
        return;
      }

      const feature = features[0];
      const coords = (feature.geometry as any).coordinates;

      mapRef.current?.flyTo({
        center: coords,
        zoom: 6,
        duration: 1500,
      });

      const disasterFeature: DisasterFeature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coords,
        },
        properties: {
          id: feature.properties?.id || "",
          name: feature.properties?.name || "",
          description: feature.properties?.description || "",
          eventType: feature.properties?.eventType,
          alertLevel: feature.properties?.alertLevel,
          severity: feature.properties?.severity || 0,
          country: feature.properties?.country || "",
          fromDate: feature.properties?.fromDate || "",
          toDate: feature.properties?.toDate || "",
          url: feature.properties?.url || "",
          episodeId: feature.properties?.episodeId || "",
        },
      };

      onSelectDisaster(disasterFeature);
    },
    [onSelectDisaster]
  );

  const handleMouseEnter = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = "pointer";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) map.getCanvas().style.cursor = "";
  }, []);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: 10,
        latitude: 20,
        zoom: 2,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      interactiveLayerIds={["disaster-circles"]}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      attributionControl={false}
    >
      <Source id="disasters" type="geojson" data={data}>
        <Layer {...glowLayer} />
        <Layer {...circleLayer} />
      </Source>
    </Map>
  );
}
