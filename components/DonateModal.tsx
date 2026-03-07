"use client";

import { useState } from "react";
import { X, Heart, CheckCircle } from "lucide-react";
import type { DisasterFeature } from "@/lib/types";
import { EVENT_TYPE_LABELS, ALERT_COLORS } from "@/lib/types";

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

interface DonateModalProps {
  feature: DisasterFeature;
  onClose: () => void;
}

export default function DonateModal({ feature, onClose }: DonateModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { properties: p } = feature;
  const alertColor = ALERT_COLORS[p.alertLevel] || "#94a3b8";
  const donationAmount = isCustom ? Number(customAmount) || 0 : selectedAmount || 0;

  function handleSubmit() {
    if (donationAmount <= 0) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div 
          className="relative bg-gray-900 border border-gray-700/50 rounded-2xl max-w-md w-full text-center space-y-4 animate-modal-in"
          style={{ padding: "1em" }}
        >
          <div className="mx-auto w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <div className="flex flex-col gap-3 mb-4">
            <h3 className="text-xl font-semibold text-white">Thank You!</h3>
            <p className="text-gray-400 text-sm">
              Your donation of{" "}
              <span className="text-white font-semibold">${donationAmount}</span>{" "}
              to support disaster relief for{" "}
              <span className="text-white font-semibold">{p.name}</span> has been
              recorded.
            </p>
            <p className="text-xs text-gray-500">
              Payment integration via Open Payments coming soon.
            </p>
            <button
              onClick={onClose}
              style={{ padding: "0.25em" }}
              className="rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div> 
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div 
        className="relative flex flex-col gap-3 bg-gray-900 border border-gray-700/50 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden animate-modal-in"
        style={{ padding: "1em" }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Donate to Relief</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {p.name} &middot;{" "}
              <span style={{ color: alertColor }}>
                {EVENT_TYPE_LABELS[p.eventType]}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5 flex flex-col gap-4">
          {/* Preset amounts */}
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setIsCustom(false);
                }}
                style={{ padding: "0.35em 0" }}
                className={`rounded-xl text-sm font-semibold transition-all ${
                  !isCustom && selectedAmount === amount
                    ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                ${amount}
              </button>
            ))}
            <button
              onClick={() => {
                setIsCustom(true);
                setSelectedAmount(null);
              }}
              className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                isCustom
                  ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom amount input */}
          {isCustom && (
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={{ padding: "0.25em 0.75em" }}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                autoFocus
              />
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={donationAmount <= 0}
            style={{ padding: "0.25em 0" }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20"
          >
            <Heart className="w-5 h-5" />
            {donationAmount > 0
              ? `Donate $${donationAmount}`
              : "Select an amount"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Powered by Open Payments. Funds go directly to verified relief
            organizations.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
