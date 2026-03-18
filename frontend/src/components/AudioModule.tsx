"use client";

import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2 } from 'lucide-react';

interface AudioModuleProps {
    onSave: (blob: Blob | null) => void;
}

// Helper function to encode AudioBuffer to a true WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let result: Float32Array;
    if (numChannels === 2) {
        const left = buffer.getChannelData(0);
        const right = buffer.getChannelData(1);
        result = new Float32Array(left.length + right.length);
        for (let i = 0; i < left.length; i++) {
            result[i * 2] = left[i];
            result[i * 2 + 1] = right[i];
        }
    } else {
        result = buffer.getChannelData(0);
    }
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = result.length * bytesPerSample;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    function writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, result[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    return new Blob([view], { type: 'audio/wav' });
}

const AudioModule: React.FC<AudioModuleProps> = ({ onSave }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const webmBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
                
                try {
                    const arrayBuffer = await webmBlob.arrayBuffer();
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const trueWavBlob = audioBufferToWav(audioBuffer);
                    
                    setAudioBlob(trueWavBlob);
                    setAudioUrl(URL.createObjectURL(trueWavBlob));
                    onSave(trueWavBlob);
                } catch (e) {
                    console.error("Audio conversion failed", e);
                    // Fallback
                    const fallbackBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
                    setAudioBlob(fallbackBlob);
                    setAudioUrl(URL.createObjectURL(fallbackBlob));
                    onSave(fallbackBlob);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or error occurred.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    };

    const clearRecording = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        chunksRef.current = [];
        onSave(null);
    };

    return (
        <div className="flex flex-col space-y-4">
            <p className="text-xs text-slate-500">
                Click Record and say &quot;Ahhhhh&quot; for as long as comfortable.
            </p>
            <div className="flex items-center justify-center w-full h-20 rounded-xl bg-white/60 border border-slate-100">
                {isRecording ? (
                    <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mb-2" />
                        <span className="text-red-500 font-mono font-bold uppercase tracking-wider text-xs">Recording...</span>
                    </div>
                ) : audioUrl ? (
                    <audio src={audioUrl} controls className="w-full px-4" />
                ) : (
                    <Mic className="w-12 h-12 text-slate-300" />
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                    >
                        <Mic className="w-4 h-4" />
                        Start recording
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                        <Square className="w-4 h-4" />
                        Stop
                    </button>
                )}
                {audioUrl && !isRecording && (
                    <button
                        onClick={clearRecording}
                        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Discard
                    </button>
                )}
            </div>
        </div>
    );
};

export default AudioModule;
