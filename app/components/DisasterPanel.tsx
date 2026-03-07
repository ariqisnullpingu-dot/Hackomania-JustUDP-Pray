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
  const alertColor = ALERT_COLORS[p.alertLevel] || "#94a3b8";

  return (
    <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] sm:max-h-full sm:top-0 sm:left-auto sm:right-0 sm:h-full sm:w-[400px] bg-gray-900/95 backdrop-blur-md border-t sm:border-t-0 sm:border-l border-gray-700/50 z-20 flex flex-col overflow-hidden animate-slide-in-mobile sm:animate-slide-in rounded-t-2xl sm:rounded-none">
      {/* Mobile drag handle */}
      <div className="sm:hidden flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-gray-600" />
      </div>

      {/* Header */}
      <div
        className="px-5 py-4 flex items-start justify-between gap-3 border-b border-gray-700/50"
        style={{ borderTopColor: alertColor, borderTopWidth: 3 }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="p-2 rounded-lg shrink-0"
            style={{ backgroundColor: `${alertColor}20`, color: alertColor }}
          >
            {EVENT_ICONS[p.eventType] || <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              {p.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${alertColor}20`,
                  color: alertColor,
                }}
              >
                {ALERT_LABELS[p.alertLevel]} Alert
              </span>
              <span className="text-xs text-gray-400">
                {EVENT_TYPE_LABELS[p.eventType]}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Description */}
        <div className="text-sm text-gray-300 leading-relaxed">
          <p dangerouslySetInnerHTML={{ __html: p.description }} />
        </div>

        {/* Details */}
        <div className="space-y-3">
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
            label="Severity"
            value={
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-[120px]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((p.severity / 10) * 100, 100)}%`,
                      backgroundColor: alertColor,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {p.severity.toFixed(1)}
                </span>
              </div>
            }
          />
        </div>

        {/* GDACS Report Link */}
        {p.url && (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Full GDACS Report
          </a>
        )}
      </div>

      {/* Donate CTA */}
      <div className="px-5 py-4 border-t border-gray-700/50">
        <button
          onClick={onDonate}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-semibold text-base transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20"
        >
          <Heart className="w-5 h-5" />
          Donate Now
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slide-in-mobile {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-slide-in-mobile {
          animation: slide-in-mobile 0.3s ease-out;
        }
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
      <div className="text-gray-500 mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="text-sm text-gray-200 mt-0.5">{value}</div>
      </div>
    </div>
  );
}
