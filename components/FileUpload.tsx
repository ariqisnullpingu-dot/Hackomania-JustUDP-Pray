"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
}

export default function FileUpload({ onFileSelect, accept = "image/*,video/*" }: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped && (dropped.type.startsWith("image/") || dropped.type.startsWith("video/"))) {
            onFileSelect(dropped);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        if (selected) onFileSelect(selected);
    }

    return (
        <>
            <button
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                style={{ padding: "0.75em" }}
                className="flex flex-col items-center gap-3 py-8 w-full rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/30 hover:bg-gray-800/40 hover:border-gray-600 transition-all cursor-pointer"
            >
                <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-gray-400" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-300">Upload File</p>
                    <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, MP4</p>
                </div>
            </button>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                className="hidden"
            />
        </>
    );
}
