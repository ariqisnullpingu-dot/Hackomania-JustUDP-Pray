"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, MapPin, ArrowLeft} from "lucide-react";
import DonateModal from "@/components/DonateModal";
import ActionCard from "@/components/ActionCard";
import type { DisasterFeature } from "@/lib/types";

export default function DonateChoicePage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [showDonateModal, setShowDonateModal] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const globalReliefFeature: DisasterFeature = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [0, 0] },
        properties: {
            id: "global-relief",
            name: "General Relief Fund",
            description: "Your contribution supports emergency response and verified disaster relief efforts across the globe. Funds are allocated based on immediate need.",
            eventType: "FL",
            alertLevel: "Green",
            severity: 1,
            fromDate: new Date().toISOString(),
            toDate: new Date().toISOString(),
            url: "",
            country: "Global",
        },
    };

    return (
        <div
            className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-20 overflow-auto"
            style={{ background: "#080d18" }}
        >
            {/* Exact Home Page Background Layers */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at 50% 0%, #0d1a35 0%, #080d18 55%, #060a14 100%)",
                }}
            />
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
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: 0.03,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                    width: "900px",
                    height: "500px",
                    background: "radial-gradient(ellipse at top, rgba(40,80,200,0.1) 0%, rgba(20,50,140,0.05) 45%, transparent 70%)",
                }}
            />

            {/* Floating navigation */}
            <div className="absolute top-6 left-6 z-20">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900/80 border border-gray-700/50 text-gray-400 hover:text-white transition-all shadow-xl group"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-semibold text-gray-400 group-hover:text-white">Back to Home</span>
                </button>
            </div>

            <div
                className={`relative z-10 flex flex-col items-center max-w-xl w-full transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
                <div className="flex flex-col gap-6 text-center items-center mb-12">
                    <h1
                        className="text-5xl sm:text-7xl font-black text-center leading-[1] tracking-tight mb-4"
                        style={{ color: "#f0f4ff" }}
                    >
                        How will you
                        <br />
                        <span style={{ color: "rgba(147,197,253,0.25)" }}>respond?</span>
                    </h1>

                    <p
                        className="text-sm tracking-[0.2em] uppercase text-center mb-0"
                        style={{ color: "rgb(255, 255, 255)" }}
                    >
                        Donation Choice
                    </p>

                    <p
                        className="text-base text-center max-w-sm leading-relaxed"
                        style={{ color: "rgba(186,218,255,0.4)" }}
                    >
                        Contribute to the general relief fund or select specific causes from the disaster map.
                    </p>
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ActionCard
                        icon={<Globe className="w-5 h-5 text-rose-400" />}
                        title="General Fund"
                        description="Donate to our central fund which will provide help to end users who need instant emergency funds."
                        accentColor="#ef4444"
                        onClick={() => setShowDonateModal(true)}
                        compact
                    />
                    <ActionCard
                        icon={<MapPin className="w-5 h-5 text-blue-400" />}
                        title="Search Specific"
                        description="Explore the disaster map and choose a specific event to support."
                        accentColor="#3b82f6"
                        onClick={() => router.push("/map")}
                        compact
                    />
                </div>
            </div>

            {showDonateModal && (
                <DonateModal
                    feature={globalReliefFeature}
                    onClose={() => setShowDonateModal(false)}
                />
            )}
        </div>
    );
}
