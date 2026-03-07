"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
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
import CameraCapture from "@/components/CameraCapture";
import FileUpload from "@/components/FileUpload";


type Stage = "upload" | "verifying" | "result";

interface VerificationResult {
  verified: boolean;
  confidence: number;
  injurySeverity: string;
  injuryDescription: string;
  surroundingDamage: string;
  damageDescription: string;
  peopleVisible: number;
  urgencyLevel: string;
  disasterType: string;
  aiDescription: string;
  gdacsMatch: boolean;
  gdacsEvents: Array<{ name: string; alertLevel: string; distance_km: number }>;
  reason: string;
  recommendedAmount: number;
  nearestCommittee: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  none: "text-gray-400",
  minor: "text-yellow-400",
  moderate: "text-orange-400",
  severe: "text-red-400",
  critical: "text-red-300",
  catastrophic: "text-red-300",
};

const URGENCY_COLORS: Record<string, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  immediate: "text-red-400",
};

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

  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: "ai_analysis", label: "Analyzing photo with AI...", status: "pending" },
    { id: "gdacs_check", label: "Cross-referencing disaster data...", status: "pending" },
    { id: "severity", label: "Assessing severity...", status: "pending" },
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

  function updateStep(id: string, updates: Partial<VerificationStep>) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }

  async function handleVerify() {
    if (!file || !location) return;

    setStage("verifying");
    setSteps([
      { id: "ai_analysis", label: "Analyzing photo with AI...", status: "pending" },
      { id: "gdacs_check", label: "Cross-referencing disaster data...", status: "pending" },
      { id: "severity", label: "Assessing severity...", status: "pending" },
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
      const res = await fetch("/api/verify-victim", { method: "POST", body: formData });
      const result: VerificationResult = await res.json();

      if (!res.ok) throw new Error((result as any).error || "Verification failed");

      updateStep("ai_analysis", {
        status: "success",
        detail: `Injury: ${result.injurySeverity} · Damage: ${result.surroundingDamage} (${result.confidence}%)`,
      });
      await sleep(600);

      updateStep("gdacs_check", { status: "running" });
      await sleep(500);
      updateStep("gdacs_check", {
        status: "success",
        detail: result.gdacsMatch
          ? `${result.gdacsEvents.length} matching event(s) found nearby`
          : "No matching GDACS events in area",
      });
      await sleep(600);

      updateStep("severity", { status: "running" });
      await sleep(400);
      updateStep("severity", {
        status: "success",
        detail: `Urgency: ${result.urgencyLevel} · ${result.peopleVisible} person(s) visible`,
      });
      await sleep(600);

      updateStep("verdict", { status: "running" });
      await sleep(500);
      updateStep("verdict", {
        status: result.verified ? "success" : "error",
        label: result.verified ? "VERIFIED — Claim Approved" : "NOT VERIFIED",
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
    <div className="relative min-h-screen w-full overflow-auto text-white" style={{ background: "#080d18" }}>
      {/* Background — matches landing page */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, #0d1a35 0%, #080d18 55%, #060a14 100%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.07, backgroundImage: "linear-gradient(rgba(99,255,151,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,255,135,0.3) 1px, transparent 1px)", backgroundSize: "80px 80px", maskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 65%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 65%)" }} />
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.03, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: "320px", height: "520px", background: "radial-gradient(ellipse at top, rgba(120,170,255,0.22) 0%, rgba(80,130,255,0.1) 30%, transparent 65%)", filter: "blur(1px)" }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: "900px", height: "500px", background: "radial-gradient(ellipse at top, rgba(40,80,200,0.1) 0%, rgba(20,50,140,0.05) 45%, transparent 70%)" }} />

      {/* Header */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl text-gray-400 hover:text-white transition-colors group px-3 py-1.5 w-fit"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-semibold">Back to Home</span>
        </Link>
      </div>

      <div className="relative min-h-screen w-full text-white flex flex-col items-center justify-center">
        <div className="flex flex-col gap-6 ">
          {/* Title */}
          <div className="text-center flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-black">
              Claim Disaster Aid
            </h1>
            <p className="mt-3 text-sm text-gray-400">
              Take a photo for AI-verified instant aid
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
                  <div 
                    className="px-4 py-2.5 border-t border-gray-700/50 flex items-center justify-between"
                    style={{ padding: "0.5em" }}
                  >
                    <span className="text-xs text-gray-400 truncate">{file?.name}</span>
                    <button
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Capture buttons */}
              {!preview && (
                <div className="grid grid-cols-2 gap-3">
                  <CameraCapture onCapture={handleFileSelect} />
                  <FileUpload onFileSelect={handleFileSelect} />
                </div>
              )}

              {/* Location status */}
              <div 
                className="flex items-center gap-3px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50"
                style={{ margin: "0.25em" }}
              >
                <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
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
                      </span> &nbsp;
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
                        className="text-sm text-blue-400 hover:text-blue-300"
                        style={{ marginLeft: "0.25em" }}
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
                className="w-full flex items-center justify-center gap-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-base transition-all active:scale-[0.98]"
                style={{
                  padding: "14px",
                  margin: "1em 0",
                  background: "rgba(20,35,80,0.7)",
                  border: "1px solid rgba(80,120,220,0.25)",
                  color: "#f0f4ff",
                }}
              >
                <Send className="w-5 h-5" />
                Verify &amp; Claim Aid
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
            <div className="flex flex-col gap-5 animate-fade-in">
              {/* Verdict banner */}
              <div
                className={`flex items-center gap-4 rounded-2xl border ${verifyResult.verified
                  ? "bg-green-500/[0.08] border-green-500/30"
                  : "bg-red-500/[0.08] border-red-500/30"
                  }`}
                style={{ padding: "0.75em" }}
              >
                {verifyResult.verified ? (
                  <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400 shrink-0" />
                )}
                <div>
                  <h3
                    className={`text-lg font-bold ${verifyResult.verified ? "text-green-300" : "text-red-300"
                      }`}
                  >
                    {verifyResult.verified ? "Claim Approved" : "Not Verified"}
                  </h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {verifyResult.reason}
                  </p>
                </div>
              </div>

              {/* Assessment details */}
              <div className="space-y-3">
                <DetailRow
                  icon={<AlertTriangle className={`w-4 h-4 ${SEVERITY_COLORS[verifyResult.injurySeverity] || "text-gray-400"}`} />}
                  label="Injury Severity"
                  value={`${verifyResult.injurySeverity.toUpperCase()} — ${verifyResult.injuryDescription}`}
                />
                <DetailRow
                  icon={<Building2 className={`w-4 h-4 ${SEVERITY_COLORS[verifyResult.surroundingDamage] || "text-gray-400"}`} />}
                  label="Surrounding Damage"
                  value={`${verifyResult.surroundingDamage.toUpperCase()} — ${verifyResult.damageDescription}`}
                />
                <DetailRow
                  icon={<ImageIcon className={`w-4 h-4 ${URGENCY_COLORS[verifyResult.urgencyLevel] || "text-gray-400"}`} />}
                  label="Urgency"
                  value={verifyResult.urgencyLevel.toUpperCase()}
                />
                <DetailRow
                  icon={<FileText className="w-4 h-4 text-gray-400" />}
                  label="People Visible"
                  value={String(verifyResult.peopleVisible)}
                />
                <DetailRow
                  icon={<ImageIcon className="w-4 h-4 text-blue-400" />}
                  label="AI Confidence"
                  value={`${verifyResult.confidence}%`}
                />
                <DetailRow
                  icon={<FileText className="w-4 h-4 text-gray-400" />}
                  label="Overall Assessment"
                  value={verifyResult.aiDescription}
                />
                {verifyResult.gdacsEvents.length > 0 && (
                  <DetailRow
                    icon={<MapPin className="w-4 h-4 text-rose-400" />}
                    label="Nearby Disaster Events"
                    value={verifyResult.gdacsEvents
                      .map((e) => `${e.name} (${e.distance_km}km)`)
                      .join(", ")}
                  />
                )}
              </div>

              {/* Claim Aid section */}
              {verifyResult.verified && !disburseResult && (
                <div className="space-y-4 pt-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
                    <Building2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Relief Organization</p>
                      <p className="text-sm text-gray-200 font-medium">
                        {verifyResult.nearestCommittee}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
                    <DollarSign className="w-5 h-5 text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Recommended Aid Amount</p>
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
                        Processing via Open Payments...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5" />
                        Claim Aid
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Claim result */}
              {disburseResult && (
                <div
                  className={`px-5 py-5 rounded-2xl border space-y-3 ${disburseResult.success
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
                      className={`font-bold ${disburseResult.success ? "text-green-300" : "text-red-300"
                        }`}
                    >
                      {disburseResult.success
                        ? "Aid Claimed Successfully"
                        : "Claim Failed"}
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
                        <span className="text-gray-500">Via:</span>{" "}
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
                  className="flex-1 rounded-xl bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-700/60 text-sm font-medium transition-colors"
                  style={{ padding: "0.25em 0" }}
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
                  Submit Another
                </button>
              </div>
            </div>
          )}
        </div>
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
    <div 
      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-900/30 border border-gray-800/30"
      style={{ padding: "0.35em 0.5em" }}
    >
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
