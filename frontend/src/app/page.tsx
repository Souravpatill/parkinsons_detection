"use client";

import React, { useState } from "react";
import Link from "next/link";
import axios from "axios";
import AudioModule from "@/components/AudioModule";
import SpiralCanvas from "@/components/SpiralCanvas";
import {
  Activity,
  LayoutDashboard,
  FileBarChart,
  Brain,
  HeartPulse
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

const API_BASE_URL = "http://localhost:8000";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, duration: 0.5, ease: "easeOut" }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Home() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [spiralBlob, setSpiralBlob] = useState<Blob | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFusionPredict = async () => {
    if (!audioBlob || !spiralBlob) {
      alert("Please complete both tests first.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    formData.append("spiral", spiralBlob, "spiral.png");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/predict/fusion`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setAnalysisResult(response.data);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell soft-scroll min-h-screen flex">
      {/* Left sidebar */}
      <aside className="sidebar-glass w-[260px] min-h-screen shrink-0 flex flex-col py-6 pl-5 pr-3 relative z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-indigo-700 tracking-tight">
            PD-Detect
          </span>
        </motion.div>
        
        <p className="section-label px-3 mb-3">Core Engine</p>
        <nav className="space-y-1">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Link href="/" className="nav-item nav-item-active" aria-current="page">
              <LayoutDashboard className="w-5 h-5 text-teal-600" />
              Patient Dashboard
            </Link>
          </motion.div>
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Link href="/technical" className="nav-item">
              <FileBarChart className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              Technical Diagnostics
            </Link>
          </motion.div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 p-8 lg:p-16 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-6xl mx-auto space-y-12"
        >
          {/* Premium Hero / Header */}
          <motion.div variants={itemVariants} className="flex flex-col gap-3 mb-6 pb-6 border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 text-teal-600">
                <Brain className="w-7 h-7" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-tight">
                Neural Assessment Protocol
              </h1>
            </div>
            <p className="text-slate-500 text-base max-w-2xl leading-relaxed pl-1">
              Conduct high-fidelity acoustic and fine-motor evaluations. Our multi-modal AI fusion engine analyzes micro-variations to provide market-leading precision.
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Active Assessments
            </span>
            <div className="flex-1 h-px bg-slate-200/70" />
          </div>

          {/* Two assessment cards side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="glass-subpanel p-6 space-y-4 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="section-label mb-1 text-indigo-500/80">Acoustic Motor</p>
                  <h2 className="text-xl font-bold text-slate-900">
                    Phonation Recording
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                   <Activity className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Capture sustained phonation to detect micro-variations.
              </p>
              <div className="pt-2">
                <AudioModule onSave={setAudioBlob} />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="glass-subpanel p-6 space-y-4 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="section-label mb-1 text-teal-500/80">Fine Motor</p>
                  <h2 className="text-xl font-bold text-slate-900">
                    Kinematic Spirals
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center">
                   <HeartPulse className="w-5 h-5 text-teal-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Assess kinematic features, tremor, and hesitation traces.
              </p>
              <div className="pt-2">
                <SpiralCanvas onSave={setSpiralBlob} />
              </div>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="pt-4">
            <div className="glass-panel p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="section-label mb-1 bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-indigo-500">Synthesis</p>
                  <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
                    Diagnostic Fusion Engine
                  </h2>
                </div>
                <motion.button
                  whileHover={(!audioBlob || !spiralBlob || loading) ? {} : { scale: 1.05 }}
                  whileTap={(!audioBlob || !spiralBlob || loading) ? {} : { scale: 0.95 }}
                  onClick={handleFusionPredict}
                  disabled={!audioBlob || !spiralBlob || loading}
                  className={`rounded-2xl px-8 py-4 text-sm font-bold tracking-wide transition-all ${
                    !audioBlob || !spiralBlob || loading
                      ? "bg-slate-100/50 text-slate-400 cursor-not-allowed border-2 border-slate-200 border-dashed"
                      : "bg-slate-900 text-white shadow-xl hover:shadow-2xl hover:bg-slate-800 border-2 border-transparent"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                       <Activity className="w-4 h-4 animate-spin"/> Processing Stream...
                    </span>
                  ) : "Initialize Fusion Analysis"}
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {!analysisResult ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="rounded-3xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 py-24 text-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-indigo-500/5" />
                    <div className="relative z-10 w-20 h-20 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center mx-auto mb-6">
                      <Brain className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-600 font-bold text-lg">
                      Awaiting multimodal input streams.
                    </p>
                    <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                      Please complete both acoustic and motor assessments above to generate high-precision insights.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25 }}
                    className="space-y-6"
                  >
                    <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-100/70 p-10 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none">
                        <Brain className="w-48 h-48 text-indigo-900 transform rotate-12" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest text-teal-800 mb-3 opacity-80">
                        Computational Assessment
                      </p>
                      <p className="text-5xl lg:text-7xl font-display font-black text-slate-900 tracking-tighter">
                        {analysisResult.prediction}
                      </p>
                      <div className="flex items-center gap-4 mt-8">
                         <div className="h-3 flex-1 max-w-sm bg-teal-200 rounded-full overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${analysisResult.score * 100}%` }} 
                              transition={{ duration: 1.2, delay: 0.2, type: "spring" }}
                              className="h-full bg-gradient-to-r from-teal-500 to-teal-600"
                            />
                         </div>
                         <p className="text-slate-800 font-mono font-extrabold text-xl">
                           {(analysisResult.score * 100).toFixed(1)}% <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-widest">Confidence</span>
                         </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <motion.div whileHover={{ y: -4, scale: 1.01 }} className="rounded-2xl bg-white/80 border border-slate-200/80 shadow-md p-6 relative overflow-hidden cursor-default transition-all">
                        <div className="absolute top-0 right-0 -m-6 w-24 h-24 bg-indigo-500/10 rounded-full mix-blend-multiply opacity-50 blur-xl"></div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Acoustic Vector Weight
                        </p>
                         <p className="text-3xl font-mono font-black text-slate-800">
                           {(analysisResult.audio_contribution * 100).toFixed(0)}%
                         </p>
                      </motion.div>
                      <motion.div whileHover={{ y: -4, scale: 1.01 }} className="rounded-2xl bg-white/80 border border-slate-200/80 shadow-md p-6 relative overflow-hidden cursor-default transition-all">
                        <div className="absolute top-0 right-0 -m-6 w-24 h-24 bg-teal-500/10 rounded-full mix-blend-multiply opacity-50 blur-xl"></div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Kinematic Vector Weight
                        </p>
                         <p className="text-3xl font-mono font-black text-slate-800">
                           {(analysisResult.motor_contribution * 100).toFixed(0)}%
                         </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
