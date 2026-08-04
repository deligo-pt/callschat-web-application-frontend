"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PhoneOff, MessageSquare, ArrowLeft, Home, Radio, Sparkles, ShieldCheck, WifiOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#0B0F19] text-white font-sans selection:bg-[#3B58F5] selection:text-white">
      {/* Background Glowing Ambient Orbs */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.25, 0.4, 0.25],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#3B58F5]/30 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-[#8B5CF6]/25 blur-[140px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">
        {/* Floating Icon Cluster */}
        <div className="relative mb-8 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute h-36 w-36 rounded-full border border-dashed border-[#3B58F5]/40"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute h-48 w-48 rounded-full border border-dashed border-[#8B5CF6]/30"
          />

          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#3B58F5] via-[#6366F1] to-[#8B5CF6] p-0.5 shadow-[0_0_50px_rgba(59,88,245,0.5)]"
          >
            <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-[#0F172A]">
              <PhoneOff className="h-10 w-10 text-[#3B58F5] animate-pulse" />
            </div>
          </motion.div>

          {/* Orbiting Badge 1 */}
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-2 -right-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-rose-400 backdrop-blur-md shadow-lg"
          >
            <WifiOff className="h-3 w-3" />
            <span>No Signal</span>
          </motion.div>

          {/* Orbiting Badge 2 */}
          <motion.div
            animate={{ y: [6, -6, 6] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-2 -left-6 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-amber-400 backdrop-blur-md shadow-lg"
          >
            <Radio className="h-3 w-3 animate-ping" />
            <span>404 Disconnected</span>
          </motion.div>
        </div>

        {/* Big 404 Text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-white/90 to-white/30 bg-clip-text text-transparent drop-shadow-sm mb-2"
        >
          404
        </motion.h1>

        {/* Heading & Subheading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4"
        >
          Call Room or Page Not Found
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-base sm:text-lg font-normal text-slate-400 max-w-lg leading-relaxed mb-10"
        >
          The conversation thread, live call frequency, or link you are trying to reach has ended, expired, or does not exist on this server.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md"
        >
          <Link
            href="/chats"
            className="group relative flex h-12 w-full sm:w-auto flex-1 items-center justify-center gap-2.5 rounded-2xl bg-[#3B58F5] px-6 font-semibold text-white shadow-[0_0_30px_rgba(59,88,245,0.4)] transition-all duration-300 hover:bg-[#344EDD] hover:shadow-[0_0_45px_rgba(59,88,245,0.6)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <MessageSquare className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Open Chats</span>
            <Sparkles className="h-3.5 w-3.5 opacity-70" />
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex h-12 w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </motion.div>

        {/* Bottom Security / Status Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-4 py-2 text-xs font-medium text-slate-500"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>CallsChat Engine · E2EE Zero-Knowledge Infrastructure</span>
        </motion.div>
      </div>
    </div>
  );
}
