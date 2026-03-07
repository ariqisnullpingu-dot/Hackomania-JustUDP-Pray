"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Status = "loading" | "success" | "error";

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<Status>("loading");
    const [result, setResult] = useState<{ amount?: string; transactionId?: string; isRecurring?: boolean } | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const interactRef = searchParams.get("interact_ref");

        if (!interactRef) {
            setErrorMsg("No interact_ref found in the callback URL. Payment was not completed.");
            setStatus("error");
            return;
        }

        const continueToken = localStorage.getItem("op_continueToken");
        const continueUri = localStorage.getItem("op_continueUri");
        const quoteId = localStorage.getItem("op_quoteId");
        const senderWalletUrl = localStorage.getItem("op_senderWalletUrl");

        if (!continueToken || !continueUri || !quoteId || !senderWalletUrl) {
            setErrorMsg(
                "Payment session data not found. Please start the donation from the map again."
            );
            setStatus("error");
            return;
        }

        const storedAmount = localStorage.getItem("op_amount");
        const isRecurring = localStorage.getItem("op_isRecurring") === "1";

        localStorage.removeItem("op_continueToken");
        localStorage.removeItem("op_continueUri");
        localStorage.removeItem("op_quoteId");
        localStorage.removeItem("op_senderWalletUrl");
        localStorage.removeItem("op_disasterName");
        localStorage.removeItem("op_amount");
        localStorage.removeItem("op_isRecurring");

        fetch("/api/payment/finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ continueToken, continueUri, interactRef, senderWalletUrl, quoteId }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) throw new Error(data.error);
                const settledZero = data.amount && parseFloat(data.amount) === 0;
                const displayAmount =
                    data.amount && !settledZero
                        ? data.amount
                        : storedAmount ? `$${storedAmount}` : undefined;
                setResult({ amount: displayAmount, transactionId: data.transactionId, isRecurring });
                setStatus("success");
            })
            .catch((err) => {
                setErrorMsg(err.message || "Payment finalisation failed.");
                setStatus("error");
            });
    }, [searchParams]);

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "#080d18" }}
        >
            {/* Background gradient (matches home page aesthetic) */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 0%, #0d1a35 0%, #080d18 55%, #060a14 100%)",
                }}
            />

            <div className="relative z-10 bg-gray-900/80 border border-gray-700/50 rounded-2xl p-10 max-w-md w-full text-center space-y-6 backdrop-blur-md shadow-2xl">
                {/* Loading */}
                {status === "loading" && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-white">Completing payment…</h1>
                            <p className="text-sm text-gray-400 mt-2">
                                Verifying your approval and sending the funds.
                            </p>
                        </div>
                    </>
                )}

                {/* Success */}
                {status === "success" && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-white">
                                {result?.isRecurring ? "Monthly Donation Set Up! 🔄" : "Donation Sent! 🎉"}
                            </h1>
                            <p className="text-sm text-gray-400 mt-2">
                                {result?.isRecurring ? (
                                    <>
                                        Your{" "}
                                        <span className="text-white font-semibold">
                                            {result.amount}/month
                                        </span>{" "}
                                        recurring donation has been authorised for 12 months.
                                        The first payment has been sent — future payments will happen automatically.
                                    </>
                                ) : result?.amount ? (
                                    <>
                                        Your donation of{" "}
                                        <span className="text-white font-semibold">{result.amount}</span>{" "}
                                        has been sent to the relief fund.
                                    </>
                                ) : (
                                    "Your donation has been sent to the relief fund."
                                )}
                            </p>
                            {result?.transactionId && (
                                <p className="mt-3 text-xs text-gray-600 break-all">
                                    TX: {result.transactionId}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3 justify-center mt-2">
                            <button
                                onClick={() => router.push("/map")}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-semibold transition-all"
                            >
                                Back to Map
                            </button>
                            <button
                                onClick={() => router.push("/")}
                                className="px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-all font-semibold"
                            >
                                Home
                            </button>
                        </div>
                    </>
                )}

                {/* Error */}
                {status === "error" && (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-white">Payment Failed</h1>
                            <p className="text-sm text-gray-400 mt-2">{errorMsg}</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => router.push("/map")}
                                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold transition-all"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => router.push("/")}
                                className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-all"
                            >
                                Home
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
