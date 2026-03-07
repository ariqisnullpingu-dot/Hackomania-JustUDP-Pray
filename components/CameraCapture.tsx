"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
    onCapture: (file: File) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function openCamera() {
        setError(null);
        setOpen(true);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            setStream(mediaStream);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play();
                }
            }, 50);
        } catch {
            setError("Camera access denied. Please allow camera permissions and try again.");
        }
    }

    function closeCamera() {
        stream?.getTracks().forEach((t) => t.stop());
        setStream(null);
        setOpen(false);
        setError(null);
    }

    function captureFrame() {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
                }
            },
            "image/jpeg",
            0.92
        );
        closeCamera();
    }

    useEffect(() => {
        return () => { stream?.getTracks().forEach((t) => t.stop()); };
    }, [stream]);

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={openCamera}
                className="flex flex-col items-center gap-3 py-8 w-full rounded-2xl border-2 border-dashed border-orange-500/30 bg-orange-500/[0.05] hover:bg-orange-500/[0.1] hover:border-orange-500/50 transition-all cursor-pointer"
            >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Camera className="w-7 h-7 text-white" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-white">Take Photo</p>
                    <p className="text-xs text-gray-500 mt-0.5">Use your camera</p>
                </div>
            </button>

            {/* Camera modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <span className="text-sm font-semibold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                                Camera
                            </span>
                            <button
                                onClick={closeCamera}
                                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Video feed or error */}
                        {error ? (
                            <div className="flex items-center justify-center h-64 px-8 text-center">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full aspect-video object-cover bg-gray-950"
                            />
                        )}

                        {/* Controls */}
                        {!error && (
                            <div className="flex items-center justify-center gap-4 px-4 py-5 border-t border-gray-800 bg-gray-950">
                                <button
                                    onClick={closeCamera}
                                    className="px-5 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={captureFrame}
                                    disabled={!stream}
                                    className="w-14 h-14 rounded-full bg-white border-4 border-orange-400 shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center"
                                    aria-label="Capture photo"
                                >
                                    <div className="w-9 h-9 rounded-full bg-orange-400" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
