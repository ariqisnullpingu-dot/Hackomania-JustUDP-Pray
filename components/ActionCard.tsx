"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

interface ActionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    accentColor: string;
    onClick: () => void;
    compact?: boolean;
}

export default function ActionCard({
    icon,
    title,
    description,
    accentColor,
    onClick,
    compact = false,
}: ActionCardProps) {
    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col gap-1 text-left w-full rounded-2xl transition-all duration-300 active:scale-[0.98] h-full"
            style={{
                padding: compact ? "24px" : "28px",
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
                className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-sm"
                style={{
                    backgroundColor: accentColor,
                    boxShadow: `0 0 8px ${accentColor}`
                }}
            />

            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
                style={{
                    border: "1px solid rgba(80,120,220,0.18)",
                    background: "rgba(20,35,80,0.6)",
                }}
            >
                {icon}
            </div>

            <div className="flex items-center justify-between">
                <h3 className={`font-bold ${compact ? "text-base" : "text-lg"}`} style={{ color: "#f0f4ff" }}>
                    {title}
                </h3>
                <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-0.5 transition-all duration-300"
                    style={{ color: "rgba(183, 216, 252, 0.68)" }}
                />
            </div>

            <p
                className={`${compact ? "text-xs" : "text-sm"} leading-relaxed mt-1`}
                style={{ color: "rgba(255, 255, 255, 0.58)" }}
            >
                {description}
            </p>
        </button>
    );
}
