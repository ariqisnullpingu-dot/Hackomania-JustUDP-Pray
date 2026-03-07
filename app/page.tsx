"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Camera,
  ArrowRight,
  Globe,
  Shield,
  Zap,
  Radio,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-auto bg-[#050507] flex flex-col items-center justify-center px-4 py-16">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-30%] left-[-15%] w-[700px] h-[700px] rounded-full bg-rose-600/[0.08] blur-[150px] animate-orb-1" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-orange-500/[0.08] blur-[130px] animate-orb-2" />
        <div className="absolute top-[30%] left-[60%] w-[400px] h-[400px] rounded-full bg-red-500/[0.06] blur-[100px] animate-orb-3" />
        <div className="absolute top-[60%] left-[20%] w-[300px] h-[300px] rounded-full bg-amber-500/[0.04] blur-[80px] animate-orb-2" />
      </div>

      {/* Radial gradient center spotlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(239,68,68,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        {/* Live indicator */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full border border-rose-500/20 bg-rose-500/[0.08] mb-10 transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="relative flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <div className="absolute w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-rose-300">
            Live — Monitoring Global Disasters
          </span>
        </div>

        {/* Title */}
        <h1
          className={`text-6xl sm:text-8xl font-black text-center leading-[0.9] transition-all duration-1000 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="text-white">DISASTER</span>
          <br />
          <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
            AID
          </span>
        </h1>

        <p
          className={`mt-6 text-sm sm:text-base font-medium tracking-[0.3em] uppercase text-gray-500 text-center transition-all duration-1000 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Emergency Fund Platform
        </p>

        <p
          className={`mt-8 text-lg text-gray-400 text-center max-w-lg leading-relaxed transition-all duration-1000 delay-300 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          Community-driven disaster relief powered by{" "}
          <span className="text-white font-semibold">Open Payments</span>.
          <br className="hidden sm:block" />
          Donate to verified disasters or report emergencies in real-time.
        </p>

        {/* Stats row */}
        <div
          className={`mt-14 flex items-center gap-4 sm:gap-8 px-6 py-4 rounded-2xl border border-gray-800/60 bg-gray-900/40 backdrop-blur-sm transition-all duration-1000 delay-400 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Stat
            icon={<Radio className="w-4 h-4 text-rose-400" />}
            value="LIVE"
            label="Disaster Feed"
            color="text-rose-400"
          />
          <div className="w-px h-10 bg-gray-700/40" />
          <Stat
            icon={<Shield className="w-4 h-4 text-blue-400" />}
            value="VERIFIED"
            label="AI Checked"
            color="text-blue-400"
          />
          <div className="w-px h-10 bg-gray-700/40" />
          <Stat
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            value="INSTANT"
            label="Disbursement"
            color="text-amber-400"
          />
        </div>

        {/* Divider */}
        <div
          className={`mt-16 mb-10 w-full flex items-center gap-4 transition-all duration-1000 delay-500 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />
          <span className="text-xs font-semibold tracking-[0.25em] text-gray-500 uppercase">
            Get Started
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700/60 to-transparent" />
        </div>

        {/* Role cards */}
        <div
          className={`w-full grid grid-cols-1 sm:grid-cols-2 gap-5 transition-all duration-1000 delay-[600ms] ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <RoleCard
            icon={<Heart className="w-6 h-6" />}
            title="I Want to Donate"
            description="View live disasters on an interactive map and send funds to verified relief efforts"
            gradient="from-rose-500 to-pink-600"
            glowColor="rose"
            hovered={hoveredRole === "donor"}
            onHover={() => setHoveredRole("donor")}
            onLeave={() => setHoveredRole(null)}
            onClick={() => router.push("/map")}
          />
          <RoleCard
            icon={<Camera className="w-6 h-6" />}
            title="Report a Disaster"
            description="Upload photographic evidence for AI verification and trigger instant aid disbursement"
            gradient="from-orange-500 to-amber-600"
            glowColor="orange"
            hovered={hoveredRole === "reporter"}
            onHover={() => setHoveredRole("reporter")}
            onLeave={() => setHoveredRole(null)}
            onClick={() => router.push("/report")}
          />
        </div>

        {/* Footer */}
        <p
          className={`mt-16 text-xs text-gray-600 text-center transition-all duration-1000 delay-700 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          Powered by GDACS &middot; Open Payments &middot; Hackomania 2026
        </p>
      </div>

      <style jsx>{`
        @keyframes orb-1 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(40px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }
        @keyframes orb-2 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-30px, 40px) scale(0.9);
          }
          66% {
            transform: translate(30px, -20px) scale(1.05);
          }
        }
        @keyframes orb-3 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, -30px) scale(1.15);
          }
        }
        .animate-orb-1 {
          animation: orb-1 12s ease-in-out infinite;
        }
        .animate-orb-2 {
          animation: orb-2 15s ease-in-out infinite;
        }
        .animate-orb-3 {
          animation: orb-3 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`text-sm font-bold tracking-wide ${color}`}>
          {value}
        </span>
      </div>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  description,
  gradient,
  glowColor,
  hovered,
  onHover,
  onLeave,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  glowColor: string;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <button
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="group relative text-left w-full"
    >
      {/* Glow */}
      <div
        className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md`}
      />

      {/* Card */}
      <div
        className={`relative rounded-2xl border transition-all duration-300 p-7 ${
          hovered
            ? "bg-gray-800/90 border-gray-600/50 scale-[1.02]"
            : "bg-gray-900/50 border-gray-800/50 scale-100"
        }`}
      >
        <div className="flex items-start justify-between mb-5">
          <div
            className={`p-3.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg transition-shadow duration-500`}
            style={{
              boxShadow: hovered
                ? `0 10px 40px rgba(${glowColor === "rose" ? "244,63,94" : "249,115,22"}, 0.4)`
                : `0 4px 15px rgba(${glowColor === "rose" ? "244,63,94" : "249,115,22"}, 0.15)`,
            }}
          >
            {icon}
          </div>
          <ArrowRight
            className={`w-5 h-5 mt-2 transition-all duration-300 ${
              hovered
                ? "text-white translate-x-0 opacity-100"
                : "text-gray-600 -translate-x-2 opacity-0"
            }`}
          />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
