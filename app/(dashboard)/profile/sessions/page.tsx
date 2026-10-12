"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Laptop, Smartphone, LogOut, ShieldAlert, Globe, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { sessionService, Session } from "@/services/session.service";

export default function SessionsManagementPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await sessionService.getSessions();
      if (res.success) {
        setSessions(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setActionLoading(sessionId);
      await sessionService.revokeSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to log out of device");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!window.confirm("Are you sure you want to log out of all other devices?")) return;
    
    try {
      setActionLoading("all");
      await sessionService.revokeOtherSessions();
      setSessions(prev => prev.filter(s => s.isCurrent));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to log out of other devices");
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceIcon = (platform: string) => {
    const isMobile = /Android|iPhone|iPad|Mobile/i.test(platform);
    return isMobile ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] dark:bg-[#0C1317]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E6EAFA] dark:border-[#222D34] bg-white dark:bg-[#111B21] px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-[#8696A0] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] dark:text-[#E9EDEF]">Active Sessions</h1>
            <p className="text-[13px] text-slate-500 dark:text-[#8696A0]">Manage devices where you're logged in</p>
          </div>
        </div>
        <button 
          onClick={fetchSessions}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#202C33] text-slate-600 dark:text-[#8696A0] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-6">
          
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30 p-4 flex gap-3">
            <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-[13px] text-blue-800 dark:text-blue-200 leading-relaxed">
              These are the devices that have logged into your account. If you don't recognize a device, log out immediately and consider updating your security settings.
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-100 dark:border-red-950/40 bg-red-50 dark:bg-red-950/20 p-4 text-center">
              <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
              <button 
                onClick={fetchSessions}
                className="mt-2 text-[13px] font-bold text-red-700 dark:text-red-400 hover:underline cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-[#E9EDEF]">Where you're logged in</h2>
                {sessions.length > 1 && (
                  <button 
                    onClick={handleRevokeOtherSessions}
                    disabled={actionLoading === "all"}
                    className="text-[13px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 cursor-pointer"
                  >
                    Log out of all other devices
                  </button>
                )}
              </div>

              {loading && sessions.length === 0 ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center justify-between rounded-xl border border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-[#202C33]"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-100 dark:bg-[#202C33] rounded"></div>
                          <div className="h-3 w-48 bg-slate-100 dark:bg-[#202C33] rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sessions.map(session => (
                    <div 
                      key={session.id} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                        session.isCurrent 
                          ? 'border-blue-200 dark:border-[#2563EB]/40 bg-[#EEF2FF] dark:bg-[#2563EB]/20' 
                          : 'border-slate-100 dark:border-[#222D34] bg-white dark:bg-[#111B21] hover:border-slate-200 dark:hover:border-[#2A3942] hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          session.isCurrent ? 'bg-blue-100 dark:bg-[#2563EB]/30 text-blue-600 dark:text-[#38BDF8]' : 'bg-slate-100 dark:bg-[#202C33] text-slate-500 dark:text-[#8696A0]'
                        }`}>
                          {getDeviceIcon(session.platform)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold text-[#0F172A] dark:text-[#E9EDEF]">
                              {session.deviceName || session.platform || "Unknown Device"}
                            </span>
                            {session.isCurrent && (
                              <span className="rounded bg-blue-600 dark:bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1 flex flex-col gap-0.5">
                            {session.browser && (
                              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-[#8696A0]">
                                <Laptop className="h-3.5 w-3.5 shrink-0" />
                                <span>{session.browser}</span>
                              </div>
                            )}
                            {(session.location || session.ipAddress) && (
                              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-[#8696A0]">
                                <Globe className="h-3.5 w-3.5 shrink-0" />
                                <span>{session.location || session.ipAddress}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-[#8696A0]">
                              <span className="w-3.5 shrink-0 text-center text-[16px] leading-none">•</span>
                              <span>Last active: {formatDate(session.lastActiveAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={actionLoading === session.id}
                          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-[#2A3942] px-3 py-1.5 text-[13px] font-semibold text-slate-600 dark:text-[#E9EDEF] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-100 dark:hover:border-red-900/40 transition-colors disabled:opacity-50 sm:w-auto w-full mt-2 sm:mt-0 cursor-pointer"
                        >
                          {actionLoading === session.id ? (
                            <RefreshCcw className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                          Log out
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
