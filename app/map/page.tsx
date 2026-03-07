"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import type { DisasterGeoJSON, DisasterFeature } from "@/lib/types";
import DisasterPanel from "@/components/DisasterPanel";
import DonateModal from "@/components/DonateModal";

const DisasterMap = dynamic(() => import("@/components/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-950">
      <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
    </div>
  ),
});

export default function MapPage() {
  const [data, setData] = useState<DisasterGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] =
    useState<DisasterFeature | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);

  const fetchDisasters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/disasters");
      if (!res.ok) throw new Error("Failed to fetch disaster data");
      const json: DisasterGeoJSON = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisasters();
  }, [fetchDisasters]);

  const handleSelectDisaster = useCallback(
    (feature: DisasterFeature | null) => {
      setSelectedFeature(feature);
      setShowDonateModal(false);
    },
    []
  );

  const stats = data
    ? {
        total: data.features.length,
        red: data.features.filter(
          (f) => f.properties.alertLevel === "Red"
        ).length,
        orange: data.features.filter(
          (f) => f.properties.alertLevel === "Orange"
        ).length,
        green: data.features.filter(
          (f) => f.properties.alertLevel === "Green"
        ).length,
      }
    : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0">
        {data && (
          <DisasterMap data={data} onSelectDisaster={handleSelectDisaster} />
        )}
        {loading && !data && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 gap-3">
            <Loader2 className="w-10 h-10 text-gray-500 animate-spin" />
            <p className="text-gray-400 text-sm">
              Loading global disaster data...
            </p>
          </div>
        )}
        {error && !data && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 gap-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
            <p className="text-gray-300">{error}</p>
            <button
              onClick={fetchDisasters}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Top-left header */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div
          className="flex flex-col gap-1 bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl"
          style={{ padding: "0.5em 0.75em" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-sm font-bold text-white tracking-wide">
              DisasterAid
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Live Global Disaster Monitor
          </p>
        </div>

        {stats && (
          <div
            className="flex flex-col gap-0.5 bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl"
            style={{ padding: "0.5em 0.75em" }}
          >
            <h1 className="text-sm font-bold text-white tracking-wide mb-2">
              DisasterAid
            </h1>
            <div className="flex items-center gap-3">
              <StatBadge color="#ef4444" count={stats.red} label="Critical" />
              <StatBadge color="#f97316" count={stats.orange} label="Warning" />
              <StatBadge color="#22c55e" count={stats.green} label="Advisory" />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.total} events tracked
            </div>
          </div>
        )}
      </div>

      {/* Refresh button */}
      <button
        onClick={fetchDisasters}
        disabled={loading}
        className="absolute top-4 right-4 z-10 bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        style={{ padding: "10px" }}
        title="Refresh data"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      </button>

      {/* Detail Panel */}
      {selectedFeature && (
        <DisasterPanel
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          onDonate={() => setShowDonateModal(true)}
        />
      )}

      {/* Donate Modal */}
      {showDonateModal && selectedFeature && (
        <DonateModal
          feature={selectedFeature}
          onClose={() => setShowDonateModal(false)}
        />
      )}
    </div>
  );
}

function StatBadge({
  color,
  count,
  label,
}: {
  color: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-medium text-white">{count}</span>
      <span className="text-xs text-gray-500 hidden sm:inline">{label}</span>
    </div>
  );
}