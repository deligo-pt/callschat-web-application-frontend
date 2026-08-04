"use client";

import React, { useState } from "react";
import { TerminalSquare, RefreshCw, Search, Download, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SystemLogsPage() {
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const logs = [
    { id: "LOG-9910", timestamp: "2026-06-27 13:40:12", level: "INFO", source: "AuthService", message: "Admin role verification passed for session usr_882190" },
    { id: "LOG-9909", timestamp: "2026-06-27 13:38:45", level: "WARN", source: "RateLimiter", message: "Spike detected on endpoint /api/v1/auth/verify (42 req/sec)" },
    { id: "LOG-9908", timestamp: "2026-06-27 13:35:01", level: "ERROR", source: "RedisCache", message: "Connection timeout on follower replica redis-node-02" },
    { id: "LOG-9907", timestamp: "2026-06-27 13:30:22", level: "INFO", source: "KYCProcessor", message: "Document OCR complete for verification submission VER-1001" },
    { id: "LOG-9906", timestamp: "2026-06-27 13:15:00", level: "INFO", source: "WebSocketHub", message: "Room signaling server rebalanced across 12 worker threads" },
    { id: "LOG-9905", timestamp: "2026-06-27 13:02:11", level: "WARN", source: "ModMatrix", message: "Automated flag generated for user USR-441920 (mass invitation)" },
    { id: "LOG-9904", timestamp: "2026-06-27 12:45:33", level: "INFO", source: "Database", message: "Daily backup snapshot completed (Size: 4.2 GB)" },
  ];

  const filtered = logs.filter(l => 
    (filterLevel === "ALL" || l.level === filterLevel) &&
    (l.message.toLowerCase().includes(search.toLowerCase()) || l.source.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            <TerminalSquare className="h-7 w-7 text-indigo-400" />
            System Audit Logs
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time infrastructure telemetry, security events, and API request audits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white">
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh Live Stream
          </Button>
          <Button size="sm" className="bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700">
            <Download className="mr-2 h-3.5 w-3.5" /> Export JSON
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#111827] p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter logs by keyword or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-10 pr-4 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "INFO", "WARN", "ERROR"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterLevel === lvl 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0B0F19] font-mono text-xs shadow-2xl overflow-hidden">
        <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex justify-between text-[11px] text-slate-400 uppercase font-sans font-bold">
          <span>Timestamp / Level / Source</span>
          <span>Log Payload Message</span>
        </div>
        <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
          {filtered.map((log) => (
            <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 hover:bg-slate-900/40 transition-colors">
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-slate-500">{log.timestamp}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  log.level === "INFO" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                  log.level === "WARN" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {log.level}
                </span>
                <span className="text-slate-300 font-semibold w-24 truncate">[{log.source}]</span>
              </div>
              <div className="text-slate-300 flex-1 break-all">
                {log.message}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
