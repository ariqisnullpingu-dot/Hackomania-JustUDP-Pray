"use client";

import {
  X,
  AlertTriangle,
  CloudRain,
  Flame,
  Mountain,
  Wind,
  Droplets,
  MapPin,
  Calendar,
  ExternalLink,
  Heart,
} from "lucide-react";
import type { DisasterFeature, EventType, AlertLevel } from "@/lib/types";
import { EVENT_TYPE_LABELS, ALERT_COLORS } from "@/lib/types";

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  EQ: <AlertTriangle className="w-5 h-5" />,
  TC: <Wind className="w-5 h-5" />,
  FL: <CloudRain className="w-5 h-5" />,
  VO: <Mountain className="w-5 h-5" />,
  WF: <Flame className="w-5 h-5" />,
  DR: <Droplets className="w-5 h-5" />,
};

const ALERT_LABELS: Record<AlertLevel, string> = {
  Red: "Critical",
  Orange: "Warning",
  Green: "Advisory",
};

interface DisasterPanelProps {
  feature: DisasterFeature;
  onClose: () => void;
  onDonate: () => void;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "Unknown";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function DisasterPanel({
  feature,
  onClose,
  onDonate,
}: DisasterPanelProps) {
  const { properties: p } = feature;
  const alertColor = ALERT_COLORS[p.alertLevel] || "#93c5fd";

  return (
    <div
      className="absolute bottom-0 left-0 right-0 max-h-[70vh] sm:max-h-full sm:top-0 sm:left-auto sm:right-0 sm:h-full sm:w-[400px] z-20 flex flex-col overflow-hidden animate-slide-in-mobile sm:animate-slide-in rounded-t-2xl sm:rounded-none"
      style={{
        background: "linear-gradient(180deg, #0c1628 0%, #080d18 100%)",
        borderLeft: "1px solid rgba(80,120,220,0.18)",
        borderTop: "1px solid rgba(80,120,220,0.18)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Subtle top glow inside panel */}
      <div
        className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% -10%, ${alertColor}18 0%, transparent 70%)`,
        }}
      />

      {/* Mobile drag handle */}
      <div className="sm:hidden flex justify-center relative z-10" style={{ paddingTop: "12px", paddingBottom: "4px" }}>
        <div
          className="w-10 h-1 rounded-full"
          style={{ background: "rgba(80,120,220,0.3)" }}
        />
      </div>

      {/* Header */}
      <div
        className="relative z-10 flex items-start justify-between gap-3"
        style={{
          padding: "1em",
          borderBottom: "1px solid rgba(80,120,220,0.12)",
          borderTop: `2px solid ${alertColor}`,
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon box */}
          <div
            className="p-2.5 rounded-xl shrink-0"
            style={{
              background: `${alertColor}15`,
              border: `1px solid ${alertColor}30`,
              color: alertColor,
            }}
          >
            {EVENT_ICONS[p.eventType] || <AlertTriangle className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <h2
              className="text-base font-bold truncate"
              style={{ color: "#f0f4ff" }}
            >
              {p.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {/* Alert badge */}
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase"
                style={{
                  background: `${alertColor}18`,
                  border: `1px solid ${alertColor}35`,
                  color: alertColor,
                }}
              >
                {ALERT_LABELS[p.alertLevel]}
              </span>
              <span
                className="text-[11px]"
                style={{ color: "rgba(147,197,253,0.45)" }}
              >
                {EVENT_TYPE_LABELS[p.eventType]}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors shrink-0"
          style={{ color: "rgba(147,197,253,0.4)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(80,120,220,0.15)";
            (e.currentTarget as HTMLButtonElement).style.color = "#f0f4ff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(147,197,253,0.4)";
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div
        className="relative z-10 flex-1 overflow-y-auto space-y-5"
        style={{ padding: "1em" }}
      >
        {/* Description */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: "rgba(186,218,255,0.5)", paddingBottom: "1em" }}
          dangerouslySetInnerHTML={{ __html: p.description }}
        />

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(80,120,220,0.1)" }} />

        {/* Details */}
        <div className="flex flex-col gap-2" style={{ padding: "1em 0" }}>
          <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location" value={p.country} />
          <DetailRow
            icon={<Calendar className="w-4 h-4" />}
            label="Started"
            value={formatDate(p.fromDate)}
          />
          {p.fromDate !== p.toDate && (
            <DetailRow
              icon={<Calendar className="w-4 h-4" />}
              label="Last Update"
              value={formatDate(p.toDate)}
            />
          )}
          <DetailRow
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Severity Score"
            value={
              <div className="flex items-center gap-3 mt-1">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[140px]"
                  style={{ background: "rgba(80,120,220,0.15)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((p.severity / 2.5) * 100, 100)}%`,
                      background: `linear-gradient(90deg, ${alertColor}99, ${alertColor})`,
                    }}
                  />
                </div>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: alertColor }}
                >
                  {p.severity.toFixed(1)}
                  <span
                    className="text-xs font-normal ml-0.5"
                    style={{ color: "rgba(147,197,253,0.35)" }}
                  >
                    /3
                  </span>
                </span>
              </div>
            }
          />
        </div>

        {/* GDACS link */}
        {p.url && (
          <>
            <div style={{ height: "1px", background: "rgba(80,120,220,0.1)" }} />
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs transition-colors"
              style={{ color: "rgba(147,197,253,0.45)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(186,218,255,0.8)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(147,197,253,0.45)")}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Full GDACS Report
            </a>
          </>
        )}
      </div>

      {/* Donate CTA */}
      <div
        className="relative z-10"
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(80,120,220,0.12)",
        }}
      >
        <button
          onClick={onDonate}
          className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
          style={{
            padding: "0.75em",
            background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
            color: "#fff",
            boxShadow: "0 4px 24px rgba(239,68,68,0.25)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 32px rgba(239,68,68,0.4)";
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(239,68,68,0.25)";
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)";
          }}
        >
          <Heart className="w-4 h-4" />
          Donate Now
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes slide-in-mobile {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .animate-slide-in        { animation: slide-in        0.3s ease-out; }
        .animate-slide-in-mobile { animation: slide-in-mobile 0.3s ease-out; }
      `}</style>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5" style={{ color: "rgba(80,120,220,0.5)" }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-[10px] uppercase tracking-widest font-medium mb-0.5"
          style={{ color: "rgba(147,197,253,0.3)" }}
        >
          {label}
        </div>
        <div className="text-sm" style={{ color: "rgba(186,218,255,0.7)" }}>
          {value}
        </div>
      </div>
    </div>
  );
}