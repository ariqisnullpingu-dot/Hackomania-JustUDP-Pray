"use client";

import { CheckCircle, Loader2, XCircle, Brain, Globe, MapPin, Scale } from "lucide-react";

export type StepStatus = "pending" | "running" | "success" | "error";

export interface VerificationStep {
  id: string;
  label: string;
  detail?: string;
  status: StepStatus;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  ai_analysis: <Brain className="w-5 h-5" />,
  gdacs_check: <Globe className="w-5 h-5" />,
  location_check: <MapPin className="w-5 h-5" />,
  verdict: <Scale className="w-5 h-5" />,
};

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />;
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-400" />;
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-gray-700" />;
  }
}

export default function VerificationSteps({ steps }: { steps: VerificationStep[] }) {
  return (
    <div className="w-full max-w-md mx-auto space-y-1">
      {steps.map((step, i) => {
        const isActive = step.status === "running";
        const isDone = step.status === "success" || step.status === "error";

        return (
          <div key={step.id}>
            <div
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-500 ${
                isActive
                  ? "bg-gray-800/80 border border-gray-700/50"
                  : isDone
                  ? "bg-transparent"
                  : "bg-transparent opacity-40"
              }`}
            >
              <div className="shrink-0">
                <StatusIcon status={step.status} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white"
                      : isDone
                      ? "text-gray-300"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </div>
                {step.detail && (
                  <div
                    className={`text-xs mt-0.5 transition-colors ${
                      step.status === "error" ? "text-red-400" : "text-gray-500"
                    }`}
                  >
                    {step.detail}
                  </div>
                )}
              </div>
              <div className="shrink-0 text-gray-600">
                {STEP_ICONS[step.id]}
              </div>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex justify-start pl-[1.65rem]">
                <div
                  className={`w-px h-4 transition-colors duration-500 ${
                    isDone ? "bg-gray-700" : "bg-gray-800/50"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
