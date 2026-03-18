"use client";

import React, { useRef, useState } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { RotateCcw, Download, Check } from 'lucide-react';

interface SpiralCanvasProps {
    onSave: (blob: Blob | null) => void;
}

const SpiralCanvas: React.FC<SpiralCanvasProps> = ({ onSave }) => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [isSaved, setIsSaved] = useState(false);

    const handleClear = () => {
        canvasRef.current?.clearCanvas();
    };

    const handleExport = async () => {
        const dataUrl = await canvasRef.current?.exportImage("png");
        if (dataUrl) {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            onSave(blob);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };

    return (
        <div className="flex flex-col space-y-4">
            <p className="text-xs text-slate-500">
                Trace a spiral from the center outward.
            </p>
            <div className="w-full max-w-[320px] aspect-square mx-auto border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-white/60">
                <ReactSketchCanvas
                    ref={canvasRef}
                    strokeWidth={4}
                    strokeColor="black"
                    canvasColor="transparent"
                />
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleClear}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Clear
                </button>
                <button
                    onClick={handleExport}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                        isSaved ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                >
                    {isSaved ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    {isSaved ? "Saved!" : "Save drawing"}
                </button>
            </div>
        </div>
    );
};

export default SpiralCanvas;
