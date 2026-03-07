"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Camera,
  MapPin,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  ImageIcon,
  AlertTriangle,
  DollarSign,
  Building2,
  FileText,
} from "lucide-react";
import VerificationSteps, {
  type VerificationStep,
} from "@/components/VerificationSteps";

type Stage = "upload" | "verifying" | "result";

interface VerificationResult {
  verified: boolean;
  confidence: number;
  disasterType: string;
  aiDescription: string;
  gdacsMatch: boolean;
  gdacsEvents: Array<{ name: string; alertLevel: string; distance_km: number }>;
  reason: string;
  recommendedAmount: number;
  nearestCommittee: string;
}

interface DisbursementResult {
  success: boolean;
  transactionId?: string;
  amount?: string;
  committee: string;
  timestamp: string;
  error?: string;
}

export default function ReportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: "ai_analysis", label: "Analyzing image with AI...", status: "pending" },
    { id: "gdacs_check", label: "Cross-referencing global disaster data...", status: "pending" },
    { id: "location_check", label: "Validating location...", status: "pending" },
    { id: "verdict", label: "Determining verdict...", status: "pending" },
  ]);

  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [disburseResult, setDisburseResult] = useState<DisbursementResult | null>(null);
  const [disbursing, setDisbursing] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`
          );
          const data = await res.json();
          const addr = data.address || {};
          const parts = [
            addr.road || addr.neighbourhood || addr.suburb,
            addr.city || addr.town || addr.village || addr.county,
            addr.country,
          ].filter(Boolean);
          setLocationName(parts.join(", ") || data.display_name || null);
        } catch {
          setLocationName(null);
        }

        setLocationLoading(false);
      },
      () => {
        setLocationError("Unable to get location. Please enable location services.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith("image/") || droppedFile.type.startsWith("video/"))) {
      handleFileSelect(droppedFile);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  }

  function updateStep(id: string, updates: Partial<VerificationStep>) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }

  async function handleVerify() {
    if (!file || !location) return;

    setStage("verifying");
    setSteps([
      { id: "ai_analysis", label: "Analyzing image with AI...", status: "pending" },
      { id: "gdacs_check", label: "Cross-referencing global disaster data...", status: "pending" },
      { id: "location_check", label: "Validating location...", status: "pending" },
      { id: "verdict", label: "Determining verdict...", status: "pending" },
    ]);

    updateStep("ai_analysis", { status: "running" });
    await sleep(800);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("latitude", String(location.lat));
    formData.append("longitude", String(location.lng));

    updateStep("ai_analysis", { status: "running", detail: "Sending to GPT-4o Vision..." });

    try {
      const res = await fetch("/api/verify-disaster", { method: "POST", body: formData });
      const result: VerificationResult = await res.json();

      if (!res.ok) throw new Error((result as any).error || "Verification failed");

      updateStep("ai_analysis", {
        status: "success",
        detail: `${result.disasterType} detected (${result.confidence}% confidence)`,
      });
      await sleep(600);

      updateStep("gdacs_check", { status: "running" });
      await sleep(500);
      updateStep("gdacs_check", {
        status: result.gdacsMatch ? "success" : "success",
        detail: result.gdacsMatch
          ? `${result.gdacsEvents.length} matching event(s) found nearby`
          : "No matching GDACS events in area",
      });
      await sleep(600);

      updateStep("location_check", { status: "running" });
      await sleep(400);
      updateStep("location_check", {
        status: "success",
        detail: locationName || `Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      });
      await sleep(600);

      updateStep("verdict", { status: "running" });
      await sleep(500);
      updateStep("verdict", {
        status: result.verified ? "success" : "error",
        label: result.verified ? "VERIFIED — Disaster Confirmed" : "NOT VERIFIED",
        detail: result.reason,
      });

      setVerifyResult(result);
      await sleep(800);
      setStage("result");
    } catch (err: any) {
      updateStep("ai_analysis", { status: "error", detail: err.message });
      updateStep("verdict", { status: "error", label: "Verification Failed", detail: err.message });
    }
  }

  async function handleDisburse() {
    if (!verifyResult || !location) return;
    setDisbursing(true);

    try {
      const res = await fetch("/api/disburse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          committee: verifyResult.nearestCommittee,
          amount: verifyResult.recommendedAmount,
          disasterType: verifyResult.disasterType,
          confidence: verifyResult.confidence,
          latitude: location.lat,
          longitude: location.lng,
        }),
      });

      const result: DisbursementResult = await res.json();
      setDisburseResult(result);
    } catch (err: any) {
      setDisburseResult({
        success: false,
        committee: verifyResult.nearestCommittee,
        timestamp: new Date().toISOString(),
        error: err.message,
      });
    } finally {
      setDisbursing(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-auto bg-[#050507] text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-500/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/[0.06] blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 sm:px-6 pt-6 pb-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="relative z-10 px-4 sm:px-6 pb-16 max-w-lg mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black">
            Report a{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Disaster
            </span>
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            Upload evidence for AI verification and instant aid disbursement
          </p>
        </div>

        {/* Stage 1: Upload */}
        {stage === "upload" && (
          <div className="space-y-5 animate-fade-in">
            {/* Preview area */}
            {preview && (
              <div className="relative rounded-2xl overflow-hidden border border-gray-700/50 bg-gray-900/50">
                {file?.type.startsWith("video/") ? (
                  <video
                    src={preview}
                    className="w-full max-h-72 object-contain bg-black"
                    controls
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-72 object-contain bg-black"
                  />
                )}
                <div className="px-4 py-2.5 border-t border-gray-700/50 flex items-center justify-between">
                  <span className="text-xs text-gray-400 truncate">{file?.name}</span>
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Capture buttons */}
            {!preview && (
              <div className="grid grid-cols-2 gap-3">
                {/* Camera capture */}
                <button
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*,video/*";
                    input.capture = "environment";
                    input.onchange = (e) => {
                      const f = (e.target as HTMLInputElement).files?.[0];
                      if (f) handleFileSelect(f);
                    };
                    input.click();
                  }}
                  className="flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-orange-500/30 bg-orange-500/[0.05] hover:bg-orange-500/[0.1] hover:border-orange-500/50 transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Take Photo</p>
                    <p className="text-xs text-gray-500 mt-0.5">Use your camera</p>
                  </div>
                </button>

                {/* File upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/30 hover:bg-gray-800/40 hover:border-gray-600 transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-300">Upload File</p>
                    <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, MP4</p>
                  </div>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Location status */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
              <MapPin className="w-5 h-5 text-orange-400 shrink-0" />
              <div className="flex-1 min-w-0">
                {locationLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">Getting your location...</span>
                  </div>
                ) : location ? (
                  <div>
                    <span className="text-sm text-gray-300">
                      {locationName || "Location captured"}
                    </span>
                    {locationName && (
                      <span className="text-xs text-gray-500 ml-2">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-sm text-red-400">{locationError || "Location unavailable"}</span>
                    <button
                      onClick={requestLocation}
                      className="text-xs text-orange-400 hover:text-orange-300 ml-2"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleVerify}
              disabled={!file || !location}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-base transition-all active:scale-[0.98] shadow-lg shadow-orange-500/20"
            >
              <Send className="w-5 h-5" />
              Verify Disaster
            </button>
          </div>
        )}

        {/* Stage 2: Verifying */}
        {stage === "verifying" && (
          <div className="space-y-8 animate-fade-in">
            {/* Preview thumbnail */}
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
              {preview && (
                <img
                  src={preview}
                  alt="Uploaded"
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-300 truncate">
                  {file?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {locationName || (location
                    ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                    : "No location")}
                </p>
              </div>
            </div>

            <VerificationSteps steps={steps} />
          </div>
        )}

        {/* Stage 3: Result */}
        {stage === "result" && verifyResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Verdict banner */}
            <div
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${
                verifyResult.verified
                  ? "bg-green-500/[0.08] border-green-500/30"
                  : "bg-red-500/[0.08] border-red-500/30"
              }`}
            >
              {verifyResult.verified ? (
                <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400 shrink-0" />
              )}
              <div>
                <h3
                  className={`text-lg font-bold ${
                    verifyResult.verified ? "text-green-300" : "text-red-300"
                  }`}
                >
                  {verifyResult.verified ? "Disaster Verified" : "Not Verified"}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  {verifyResult.reason}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <DetailRow
                icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
                label="Type"
                value={verifyResult.disasterType}
              />
              <DetailRow
                icon={<ImageIcon className="w-4 h-4 text-blue-400" />}
                label="AI Confidence"
                value={`${verifyResult.confidence}%`}
              />
              <DetailRow
                icon={<FileText className="w-4 h-4 text-gray-400" />}
                label="AI Description"
                value={verifyResult.aiDescription}
              />
              {verifyResult.gdacsEvents.length > 0 && (
                <DetailRow
                  icon={<MapPin className="w-4 h-4 text-rose-400" />}
                  label="Nearby Events"
                  value={verifyResult.gdacsEvents
                    .map((e) => `${e.name} (${e.distance_km}km)`)
                    .join(", ")}
                />
              )}
            </div>

            {/* Disbursement section */}
            {verifyResult.verified && !disburseResult && (
              <div className="space-y-4 pt-2">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
                  <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Nearest Committee</p>
                    <p className="text-sm text-gray-200 font-medium">
                      {verifyResult.nearestCommittee}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
                  <DollarSign className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Recommended Disbursement</p>
                    <p className="text-sm text-gray-200 font-medium">
                      ${verifyResult.recommendedAmount.toFixed(2)} USD
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDisburse}
                  disabled={disbursing}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:opacity-60 text-white font-semibold text-base transition-all active:scale-[0.98] shadow-lg shadow-green-500/20"
                >
                  {disbursing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending via Open Payments...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Disburse Funds Now
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Disbursement result */}
            {disburseResult && (
              <div
                className={`px-5 py-5 rounded-2xl border space-y-3 ${
                  disburseResult.success
                    ? "bg-green-500/[0.08] border-green-500/30"
                    : "bg-red-500/[0.08] border-red-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {disburseResult.success ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <h3
                    className={`font-bold ${
                      disburseResult.success ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    {disburseResult.success
                      ? "Funds Disbursed Successfully"
                      : "Disbursement Failed"}
                  </h3>
                </div>
                {disburseResult.success && (
                  <div className="space-y-1.5 text-sm">
                    <p className="text-gray-400">
                      <span className="text-gray-500">Amount:</span>{" "}
                      <span className="text-white font-medium">
                        {disburseResult.amount}
                      </span>
                    </p>
                    <p className="text-gray-400">
                      <span className="text-gray-500">Recipient:</span>{" "}
                      <span className="text-white font-medium">
                        {disburseResult.committee}
                      </span>
                    </p>
                    <p className="text-gray-400">
                      <span className="text-gray-500">Transaction ID:</span>{" "}
                      <span className="text-white font-mono text-xs">
                        {disburseResult.transactionId}
                      </span>
                    </p>
                  </div>
                )}
                {disburseResult.error && (
                  <p className="text-sm text-red-400">{disburseResult.error}</p>
                )}
              </div>
            )}

            {/* Back / Report Another */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700/60 text-sm font-medium transition-colors"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setStage("upload");
                  setFile(null);
                  setPreview(null);
                  setVerifyResult(null);
                  setDisburseResult(null);
                }}
                className="flex-1 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700/60 text-sm font-medium transition-colors"
              >
                Report Another
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-900/30 border border-gray-800/30">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
