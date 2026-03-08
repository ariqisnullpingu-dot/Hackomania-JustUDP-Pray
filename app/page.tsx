"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShieldCheck, ArrowRight } from "lucide-react";
import ActionCard from "@/components/ActionCard";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-20 overflow-auto"
      style={{ background: "#07090f" }}
    >
      {/* Deep base gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, #0e1a2e 0%, #07090f 60%, #050709 100%)",
        }}
      />

      {/* Warm orange/red glow from top — urgency signal */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse at top, rgba(220,60,30,0.18) 0%, rgba(180,40,20,0.07) 40%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* Cool blue halo behind */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "1000px",
          height: "500px",
          background: "radial-gradient(ellipse at top, rgba(30,70,180,0.1) 0%, rgba(15,40,120,0.04) 50%, transparent 72%)",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.055,
          backgroundImage: `
            linear-gradient(rgba(255,120,60,0.25) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,120,60,0.25) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 60%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 60%)",
        }}
      />

      {/* Noise grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center max-w-xl w-full transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Status pill */}
        <div
          className="flex items-center gap-2 rounded-full mb-10"
          style={{
            padding: "6px 14px",
            border: "1px solid rgba(220,80,40,0.3)",
            background: "rgba(180,50,20,0.12)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#f97316", boxShadow: "0 0 6px #f97316" }}
          />
          <span
            className="text-[11px] font-semibold tracking-[0.18em] uppercase"
            style={{ color: "rgba(253,186,116,0.85)" }}
          >
            Live Monitoring Active
          </span>
        </div>

        {/* Hero heading */}
        <div className="flex flex-col items-center text-center" style={{ marginBottom: "16px" }}>
          <h1
            className="font-black text-center leading-[0.95] tracking-tight"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 5.5rem)",
              color: "#f0f4ff",
              letterSpacing: "-0.03em",
            }}
          >
            Disaster
          </h1>
          <h1
            className="font-black text-center leading-[0.95] tracking-tight"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 5.5rem)",
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #f97316 0%, #ef4444 50%, #dc2626 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Aid
          </h1>
        </div>

        {/* Subtitle label */}
        <p
          className="text-xs tracking-[0.28em] uppercase text-center"
          style={{ color: "rgba(253,186,116,0.55)", marginBottom: "28px" }}
        >
          Emergency Fund Platform
        </p>

        {/* Thin divider */}
        <div
          style={{
            width: "40px",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)",
            marginBottom: "1em",
          }}
        />

        {/* Body copy */}
        <p
          className="text-base text-center leading-relaxed mx-auto"
          style={{
            color: "rgba(203,213,225,0.6)",
            maxWidth: "340px",
            marginBottom: "48px",
          }}
        >
          Community-driven disaster relief powered by{" "}
          <span style={{ color: "rgba(253,186,116,0.9)", fontWeight: 500 }}>
            Open Payments
          </span>
          . Donate to verified disasters or report emergencies in real-time.
        </p>

        {/* Action cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard
            icon={<Heart className="w-5 h-5 text-rose-500" />}
            title="Donate"
            description="View live disasters on the map and fund verified relief efforts"
            accentColor="#ef4444"
            onClick={() => router.push("/donate")}
          />
          <ActionCard
            icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
            title="Claim Aid"
            description="Take a photo for AI-verified instant aid disbursement"
            accentColor="#10b981"
            onClick={() => router.push("/report")}
          />
        </div>

        {/* Footer */}
        <p
          className="text-center tracking-wider"
          style={{
            marginTop: "48px",
            fontSize: "10px",
            color: "rgba(148,163,184,0.18)",
            letterSpacing: "0.2em",
          }}
        >
          GDACS · Open Payments · Hackomania 2026
        </p>
      </div>
    </div>
  );
}