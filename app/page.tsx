"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Camera, ArrowRight, Shield, Zap, Radio } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-20 overflow-auto"
      style={{ background: "#080d18" }}
    >

      {/* Dark navy base gradient — matches AuthKit's rich depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, #0d1a35 0%, #080d18 55%, #060a14 100%)",
        }}
      />

      {/* Subtle grid lines — like AuthKit's faint perspective grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.07,
          backgroundImage: `
            linear-gradient(rgba(99, 255, 151, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 255, 135, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black 0%, transparent 65%)",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* AuthKit-style narrow bright spotlight from top center */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "320px",
          height: "520px",
          background: "radial-gradient(ellipse at top, rgba(120,170,255,0.22) 0%, rgba(80,130,255,0.1) 30%, transparent 65%)",
          filter: "blur(1px)",
        }}
      />

      {/* Wider soft halo behind spotlight */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "900px",
          height: "500px",
          background: "radial-gradient(ellipse at top, rgba(40,80,200,0.1) 0%, rgba(20,50,140,0.05) 45%, transparent 70%)",
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center max-w-xl w-full transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
      >
        {/* Live badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-12"
          style={{
            border: "1px solid rgba(80,120,220,0.2)",
            background: "rgba(15,28,70,0.6)",
          }}
        >
        </div>

        {/* Heading */}
        <div 
          className="flex flex-col gap-6 text-center items-center"
        >
          <h1
            className="text-5xl sm:text-7xl font-black text-center leading-[1] tracking-tight mb-4"
            style={{ color: "#f0f4ff" }}
          >
            Disaster
            <br />
            <span style={{ color: "rgba(147,197,253,0.25)" }}>Aid</span>
          </h1>

          <p
            className="text-sm tracking-[0.2em] uppercase text-center mb-8"
            style={{ color: "rgb(255, 255, 255)" }}
          >
            Emergency Fund Platform
          </p>

          <p
            className="text-base text-center max-w-sm leading-relaxed mb-14"
            style={{ color: "rgba(186,218,255,0.4)" }}
          >
            Community-driven disaster relief powered by{" "}
            <span style={{ color: "rgba(186,218,255,0.75)" }}>Open Payments</span>.
            Donate to verified disasters or report emergencies in real-time.
          </p>



          {/* Role cards */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ActionCard
              icon={<Heart className="w-5 h-5" style={{ color: "rgba(240,244,255,0.8)" }} />}
              title="Donate"
              description="View live disasters on the map and fund verified relief efforts"
              accentColor="#ef4444"
              onClick={() => router.push("/map")}
            />
            <ActionCard
              icon={<Camera className="w-5 h-5" style={{ color: "rgba(240,244,255,0.8)" }} />}
              title="Report"
              description="Upload evidence for AI verification and trigger instant disbursement"
              accentColor="#3b82f6"
              onClick={() => router.push("/report")}
            />
          </div>

          {/* Footer */}
          <p
            className="mt-14 text-[11px] text-center tracking-wider"
            style={{ color: "rgba(147,197,253,0.12)" }}
          >
            GDACS · Open Payments · Hackomania 2026
          </p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 py-4">
      <div
        className="flex items-center gap-1.5"
        style={{ color: "rgba(147,197,253,0.35)" }}
      >
        {icon}
        <span
          className="text-xs font-bold tracking-wide"
          style={{ color: "rgba(186,218,255,0.55)" }}
        >
          {value}
        </span>
      </div>
      <span
        className="text-[9px] uppercase tracking-widest"
        style={{ color: "rgba(147,197,253,0.2)" }}
      >
        {label}
      </span>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  accentColor,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-1 text-left w-full rounded-2xl transition-all duration-300 active:scale-[0.98]"
      style={{
        padding: "28px",
        border: "1px solid rgba(80,120,220,0.15)",
        background: "rgba(12,20,45,0.7)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(18,32,70,0.85)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(100,150,255,0.25)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(12,20,45,0.7)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(80,120,220,0.15)";
      }}
    >
      {/* Accent dot */}
      <div
        className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: accentColor }}
      />

      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        style={{
          border: "1px solid rgba(80,120,220,0.18)",
          background: "rgba(20,35,80,0.6)",
        }}
      >
        {icon}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold" style={{ color: "#f0f4ff" }}>
          {title}
        </h3>
        <ArrowRight
          className="w-4 h-4 group-hover:translate-x-0.5 transition-all duration-300"
          style={{ color: "rgba(147,197,253,0.25)" }}
        />
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(147,197,253,0.38)" }}>
        {description}
      </p>
    </button>
  );
}