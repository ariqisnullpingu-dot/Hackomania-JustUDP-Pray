"use client";

import { useState } from "react";
import { X, Heart, CheckCircle, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import type { DisasterFeature } from "@/lib/types";
import { EVENT_TYPE_LABELS, ALERT_COLORS } from "@/lib/types";

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

// Real recipient wallet — the Central Wallet.
const REAL_WALLET = process.env.NEXT_PUBLIC_CENTRAL_WALLET_ADDRESS_URL ?? "https://ilp.interledger-test.dev/central";

type Step = "amount" | "pending_approval" | "success" | "error";

interface PendingData {
  approvalUrl: string;
  continueToken: string;
  continueUri: string;
  quoteId: string;
  senderWalletUrl: string;
}

interface DonateModalProps {
  feature: DisasterFeature;
  onClose: () => void;
}

export default function DonateModal({ feature, onClose }: DonateModalProps) {
  const [step, setStep] = useState<Step>("amount");
  const [isMonthly, setIsMonthly] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingData, setPendingData] = useState<PendingData | null>(null);
  const [result, setResult] = useState<{ transactionId?: string; amount?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const { properties: p } = feature;
  const alertColor = ALERT_COLORS[p.alertLevel] || "#94a3b8";
  const donationAmount = isCustom ? Number(customAmount) || 0 : selectedAmount || 0;
  const recipientWalletUrl = REAL_WALLET;

  async function handleDonate() {
    if (donationAmount <= 0) return;
    setLoading(true);

    try {
      const endpoint = isMonthly ? "/api/payment/subscribe" : "/api/payment/initiate";
      const body: Record<string, unknown> = {
        recipientWalletUrl,
        amountDollars: donationAmount,
      };
      if (isMonthly) {
        body.months = 12;       // 12 monthly payments
        body.periodMonths = 1;  // every 1 month
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.approvalUrl) {
        throw new Error(data.error || "Failed to initiate payment.");
      }

      if (!data.approvalUrl && data.continueToken?.startsWith("https://")) {
        setResult({ transactionId: data.continueToken });
        setStep("success");
        return;
      }

      localStorage.setItem("op_continueToken", data.continueToken);
      localStorage.setItem("op_continueUri", data.continueUri);
      localStorage.setItem("op_quoteId", data.quoteId);
      localStorage.setItem("op_senderWalletUrl", data.senderWalletUrl);
      localStorage.setItem("op_disasterName", p.name);
      localStorage.setItem("op_amount", String(donationAmount));
      localStorage.setItem("op_isRecurring", isMonthly ? "1" : "0");

      setPendingData(data as PendingData);
      setStep("pending_approval");
    } catch (err: any) {
      setErrorMsg(err.message || "Unexpected error.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex flex-col gap-3 bg-gray-900 border border-gray-700/50 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden animate-modal-in"
        style={{ padding: "1em" }}
      >

        {/* ── Amount selection ─────────────────────── */}
        {step === "amount" && (
          <>
            <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Donate to Relief</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  {p.name}{" "}
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
              {/* One-time / Monthly toggle */}
              <div className="flex rounded-xl overflow-hidden border border-gray-700/60 text-sm font-semibold">
                <button
                  onClick={() => setIsMonthly(false)}
                  className={`flex-1 py-2 transition-all ${!isMonthly
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                    }`}
                  style={{ padding: "0.2em 0" }}
                >
                  One-time
                </button>
                <button
                  onClick={() => setIsMonthly(true)}
                  className={`flex-1 py-2 transition-all ${isMonthly
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                    }`}
                  style={{ padding: "0.2em 0" }}
                >
                  Monthly
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setIsCustom(false); }}
                    style={{ padding: "0.35em 0" }}
                    className={`rounded-xl text-sm font-semibold transition-all ${!isCustom && selectedAmount === amount
                      ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                  >
                    ${amount}
                  </button>
                ))}
                <button
                  onClick={() => { setIsCustom(true); setSelectedAmount(null); }}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${isCustom
                    ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  Custom
                </button>
              </div>

              {isCustom && (
                <div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-center focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                </div>
              )}

              <button
                onClick={handleDonate}
                disabled={donationAmount <= 0 || loading}
                style={{ padding: "0.25em 0" }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Preparing…</>
                ) : (
                  <><Heart className="w-5 h-5" /> {donationAmount > 0
                    ? isMonthly
                      ? `Donate $${donationAmount}/month × 12`
                      : `Donate $${donationAmount}`
                    : "Select an amount"}</>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Powered by Open Payments · Funds go directly to verified relief organisations.
              </p>
            </div>
          </>
        )}

        {/* ── Pending approval ─────────────────────── */}
        {step === "pending_approval" && pendingData && (
          <div className="px-6 py-8 space-y-6 text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-blue-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Approve in your wallet</h3>
              <p className="text-sm text-gray-400">
                {isMonthly ? (
                  <>
                    Your wallet needs to authorise a recurring{" "}
                    <span className="text-white font-medium">${donationAmount}/month × 12</span> grant.
                    You only approve <strong>once</strong> — payments recur automatically each month.
                  </>
                ) : (
                  <>
                    Your wallet provider needs to authorise this{" "}
                    <span className="text-white font-medium">${donationAmount}</span> payment.
                    Click the button below, approve it, then come back here.
                  </>
                )}
              </p>
            </div>

            <a
              href={pendingData.approvalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/20"
            >
              <ExternalLink className="w-5 h-5" />
              Open Wallet to Approve
            </a>

            <div className="space-y-2 text-sm text-gray-400">
              <p>After approving, you&apos;ll be redirected back automatically and your donation will complete.</p>
              <p className="text-xs text-gray-600">Keep this window open while you approve.</p>
            </div>
          </div>
        )}

        {/* ── Success ─────────────────────────────── */}
        {step === "success" && (
          <div className="px-6 py-8 space-y-5 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Thank You!</h3>
              <p className="text-gray-400 text-sm">
                Your donation of{" "}
                <span className="text-white font-semibold">{result?.amount ?? `$${donationAmount}`}</span>{" "}
                to <span className="text-white font-semibold">{p.name}</span> has been sent.
              </p>
              {result?.transactionId && (
                <p className="mt-2 text-xs text-gray-600 break-all">
                  TX: {result.transactionId}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Error ───────────────────────────────── */}
        {step === "error" && (
          <div className="px-6 py-8 space-y-5 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Payment Failed</h3>
              <p className="text-sm text-gray-400">{errorMsg}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setStep("amount"); setErrorMsg(""); }}
                className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
              >
                Try Again
              </button>
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal-in { animation: modal-in 0.25s ease-out; }
      `}</style>
    </div>
  );
}
