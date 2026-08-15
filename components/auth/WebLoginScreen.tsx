"use client";

import { cn } from "@/lib/utils";
import { Globe, HelpCircle, Mail, MessageCircle, MessageSquare, Moon, Phone, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";
import QRCode from "react-qr-code";
import { useQrLogin } from "@/hooks/useQrLogin";

export default function WebLoginScreen() {
  const router = useRouter();
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);

  // Real QR login state — connected to the /qr-auth Socket.IO namespace
  const { status, qrValue, countdown, errorMessage, refreshQrCode } = useQrLogin();

  const formatTime = (s: number) => `00:${s.toString().padStart(2, "0")}`;

  // Whether the QR code box should show a loading/error overlay
  const isQrReady = status === "ready" || status === "expired";
  const isLoading = status === "connecting" || status === "generating";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-x-hidden flex flex-col">

      {/* Background SVG pattern */}
      <img
        src="/figma/bg_pattern.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: -336, top: 374, width: 1312, height: 1182, opacity: 0.77 }}
      />

      {/* Top-right subtract decoration */}
      <img
        src="/figma/subtract_decor.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ right: 0, top: 0, width: 251, height: 259, opacity: 0.5, color: "#C7DFFE" }}
      />

      {/* ── NAVBAR ── */}
      <header
        className="relative z-20 flex items-center justify-between w-full"
        style={{ height: 64, paddingLeft: 'clamp(1rem, 5vw, 43px)', paddingRight: 'clamp(1rem, 5vw, 43px)', borderBottom: "0.667px solid #F3F4F6", background: "#fff", boxShadow: "0px 1px 2px -1px rgba(0,0,0,.1),0px 1px 3px 0px rgba(0,0,0,.1)" }}
      >
        {/* Logo */}
        <div className="flex items-center">
          <Image src="/call_chats_logo.png" alt="CallsChat" width={79} height={57} className="object-contain" />
          <span className="hidden sm:inline-block" style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 23.75, lineHeight: 1, marginLeft: -12 }}>
            <span style={{ color: "#02235F" }}>Calls</span>
            <span style={{ color: "#037CFD" }}>Chat</span>
          </span>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-2 sm:gap-[12px]">
          {/* Dark mode toggle */}
          <button
            className="flex items-center"
            style={{ gap: 10, padding: "8px 12px", border: "0.667px solid #B5B5B5", borderRadius: 18 }}
          >
            <Moon size={16} style={{ color: "#364153" }} />
            <span className="hidden md:inline-block" style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#364153", lineHeight: "19.5px" }}>
              Dark mode
            </span>
            {/* Toggle on */}
            <div className="relative" style={{ width: 40, height: 22, background: "#155DFC", borderRadius: 9999 }}>
              <div
                className="absolute"
                style={{ right: 2, top: 2, width: 18, height: 18, background: "#fff", borderRadius: 9999, boxShadow: "0px 1px 2px -1px rgba(0,0,0,.1),0px 1px 3px 0px rgba(0,0,0,.1)" }}
              />
            </div>
          </button>

          {/* Language */}
          <button
            className="flex items-center"
            style={{ gap: 8, padding: "8px 12px", border: "0.667px solid #B5B5B5", borderRadius: 18 }}
          >
            <Globe size={16} style={{ color: "#364153" }} />
            <span className="hidden md:inline-block" style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#364153", lineHeight: "19.5px" }}>
              English
            </span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#364153" strokeWidth={2}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative w-full flex-grow flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-8 px-4 sm:px-8 md:px-12 lg:px-[68px] pt-10 pb-20 max-w-[1440px] mx-auto z-10">

        {/* ── LEFT: Marketing copy ── */}
        <div className="flex flex-col w-full lg:w-1/2 max-w-[565px] lg:pt-10 xl:pt-[41px] relative">
          
          {/* Headings */}
          <div className="flex flex-col mb-5 lg:mb-0 lg:gap-[-10px] text-center lg:text-left">
            <h1 className="font-roboto font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.2em] text-[#101828] m-0">
              The future of
            </h1>
            <h1 className="font-roboto font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.2em] text-[#155DFC] m-0 lg:pt-2">
              secure messaging
            </h1>
          </div>
          
          <div className="pt-4 lg:pt-5 mb-10 text-center lg:text-left">
            <p className="font-roboto font-normal text-lg sm:text-[20px] leading-[1.2em] text-[#6A7282] max-w-[448px] m-0 mx-auto lg:mx-0">
              AI-powered conversations with end-to-end encryption. Connect across devices seamlessly — your privacy, your control, your conversations.
            </p>
          </div>

          {/* ── FEATURE CARDS ── */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-[16px] xl:gap-[22.18px] mb-[40px] lg:mb-[90px]">
            {/* E2E Encrypted */}
            <div
              className="relative shrink-0 flex flex-col"
              style={{ width: 'clamp(140px, 15vw, 157.89px)', height: 117.44, background: "#fff", border: "1.305px solid #2563EB", borderRadius: 10.44, padding: '16px' }}
            >
              <Image src="/figma/icon_e2e.png" alt="E2E" width={18} height={22} className="object-cover mb-auto" />
              <div className="flex flex-col">
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14.35, color: "#2563EB" }}>E2E Encrypted</span>
                <span style={{ fontFamily: "Inter", fontWeight: 300, fontSize: 13.05, color: "#2563EB" }}>Military-grade</span>
              </div>
            </div>

            {/* AI-Powered (selected/elevated) */}
            <div className="relative shrink-0" style={{ width: 'clamp(150px, 16vw, 165.72px)', height: 122.66 }}>
              {/* dark bg shadow layer */}
              <div className="absolute right-0 bottom-0 w-[calc(100%-6px)] h-[calc(100%-6px)] bg-[#131928] rounded-[13.05px]" style={{ border: "1.305px solid #222836" }} />
              {/* white card on top */}
              <div className="absolute left-0 top-0 w-[calc(100%-6px)] h-[calc(100%-6px)] bg-white rounded-[10.44px] flex flex-col p-4" style={{ border: "1.305px solid #2563EB" }}>
                <Image src="/figma/icon_ai.png" alt="AI" width={22} height={22} className="object-cover mb-auto" />
                <div className="flex flex-col">
                  <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 14.35, color: "#2563EB" }}>AI-Powered</span>
                  <span style={{ fontFamily: "Inter", fontWeight: 300, fontSize: 11.74, color: "#2563EB" }}>Smart replies</span>
                </div>
              </div>
            </div>

            {/* Instant Sync */}
            <div
              className="relative shrink-0 flex flex-col"
              style={{ width: 'clamp(140px, 15vw, 157.89px)', height: 117.44, background: "#fff", border: "1.305px solid #2563EB", borderRadius: 10.44, padding: '16px' }}
            >
              <Image src="/figma/icon_sync.png" alt="Sync" width={14} height={21} className="object-cover mb-auto" />
              <div className="flex flex-col">
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13.05, color: "#2563EB" }}>Instant Sync</span>
                <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 11.74, color: "#2563EB" }}>All devices</span>
              </div>
            </div>
          </div>

          {/* ── APP DOWNLOAD CARD ── */}
          <div className="relative z-20 mx-auto lg:mx-0 w-full max-w-[402px] lg:ml-[78px] xl:ml-[78px]">
            <div
              style={{
                background: "#fff", border: "0.667px solid #F3F4F6", borderRadius: 16,
                boxShadow: "0px 1px 2px -1px rgba(0,0,0,.1),0px 1px 3px 0px rgba(0,0,0,.1)",
                padding: 20, display: "flex", flexDirection: "column", gap: 20
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 11 }}>
                <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 16, lineHeight: "24px", color: "#101828", textAlign: "center" }}>
                  Get CallsChat for your phone
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                {/* Google Play */}
                <button
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", maxWidth: 188, height: 55, padding: "10px 16px", border: "2px solid #E5E7EB", borderRadius: 18, background: "transparent" }}
                >
                  <svg width={20} height={20} viewBox="0 0 512 512">
                    <path fill="#3BCCFF" d="M22 0C10.7 7.5 3 22 3 41.5v429c0 19.5 7.7 34 19 41.5l257.5-256L22 0z"/>
                    <path fill="#FF3333" d="M346.5 268l-68-68L22 429c13.2 12.3 33.7 13.8 54 2.1L346.5 268z"/>
                    <path fill="#FFD400" d="M346.5 244l102.5-59c23.5-13.5 23.5-35.5 0-49L346.5 77l-68 68 68 99z"/>
                    <path fill="#48FF48" d="M22 83l256.5 256 68-68L76 2.1C55.7-9.6 35.2-8.1 22 4.2L22 83z"/>
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 9, lineHeight: "13.5px", color: "#6A7282" }}>GET IT ON</span>
                    <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, lineHeight: "17.5px", color: "#101828" }}>Google Play</span>
                  </div>
                </button>
                {/* App Store */}
                <button
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", maxWidth: 188, height: 55, padding: "10px 16px", border: "2px solid #E5E7EB", borderRadius: 18, background: "transparent" }}
                >
                  <svg width={20} height={20} viewBox="0 0 384 512" fill="#101828">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 9, lineHeight: "13.5px", color: "#6A7282" }}>Download on the</span>
                    <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, lineHeight: "17.5px", color: "#101828" }}>App Store</span>
                  </div>
                </button>
              </div>
            </div>

            {/* ── PHONE MOCKUPS ── */}
            <div className="relative mt-8 mb-12 lg:mt-0 lg:mb-0 lg:absolute lg:-left-[42px] lg:top-[168px] w-[295px] h-[326px] mx-auto lg:mx-0 lg:z-[-1]">
              {/* Back phone */}
              <Image
                src="/figma/phone_back.png"
                alt="Phone back"
                width={187}
                height={309}
                className="absolute left-[108.43px] top-[7.95px] object-cover rounded-[24px]"
              />
              {/* Front phone */}
              <Image
                src="/figma/phone_front.png"
                alt="Phone front"
                width={165}
                height={326}
                className="absolute left-0 top-0 object-cover rounded-[24px]"
                style={{ boxShadow: "6.15px 3.08px 19.76px 7.69px rgba(0,0,0,0.11)" }}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Blue QR Login Panel ── */}
        <div className="flex flex-col w-full lg:w-1/2 max-w-[519px] items-center lg:items-end z-20">
          <div
            className="w-full flex flex-col justify-between"
            style={{
              height: 'auto', minHeight: 642,
              background: "linear-gradient(224deg, rgba(8,46,121,1) 0%, rgba(11,63,165,1) 65%, rgba(15,85,223,1) 100%)",
              borderRadius: 16,
              padding: '70px 0 45px 0'
            }}
          >
            {/* Instructions block */}
            <div className="px-6 sm:px-[57px] flex flex-col gap-[18px]">
              <div className="flex flex-col gap-[2px]">
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 19, color: "#fff", lineHeight: "25px" }}>Scan to log in</span>
                <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 11, color: "#fff", lineHeight: "17px" }}>Use your CallsChat mobile app to scan</span>
              </div>
              <div className="flex flex-col gap-[7px]">
                {[
                  { num: "1", text: "Open CallsChat on your phone", numColor: "#CAE3FB" },
                  { num: "2", text: "Tap Menu → Linked Devices", numColor: "#CDE4FB" },
                  { num: "3", text: "Point your camera at this screen", numColor: "#CBE3FB" },
                ].map(({ num, text, numColor }) => (
                  <div key={num} className="flex items-center gap-[9px]">
                    <div style={{ width: 28, height: 27, borderRadius: 6, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 10, color: numColor }}>{num}</span>
                    </div>
                    <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 11, color: "#fff" }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code box */}
            <div className="w-full flex justify-center mt-12 mb-[14px] px-4">
              <div
                style={{
                  width: '100%', maxWidth: 311, height: 275,
                  background: "#fff", borderRadius: 9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "7px",
                  position: "relative",
                }}
              >
                {/* Real QR code when token is ready */}
                {isQrReady && qrValue && (
                  <div style={{ position: "relative", width: 263, height: 263, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <QRCode value={qrValue} size={263} fgColor="#2563EB" level="Q" style={{ width: "100%", height: "100%", maxWidth: 263, maxHeight: 263 }} />
                    {/* Logo overlay */}
                    <div style={{ position: "absolute", width: 65, height: 62, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 62, height: 62, borderRadius: 9999, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Image src="/call_chats_logo.png" alt="Logo" width={58} height={42} style={{ objectFit: "contain" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading overlay (connecting / generating) */}
                {isLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: 9999,
                        border: "3px solid #E5E7EB",
                        borderTopColor: "#2563EB",
                        animation: "spin 0.9s linear infinite",
                      }}
                    />
                    <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#6A7282" }}>
                      {status === "connecting" ? "Connecting…" : "Generating QR…"}
                    </span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}

                {/* Success overlay */}
                {isSuccess && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 9999, background: "#22C55E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, color: "#16A34A" }}>Logged in!</span>
                    <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 12, color: "#6A7282" }}>Redirecting…</span>
                  </div>
                )}

                {/* Error overlay */}
                {isError && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "0 12px", textAlign: "center" }}>
                    <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#EF4444" }}>
                      {errorMessage || "Something went wrong."}
                    </span>
                    <button
                      onClick={refreshQrCode}
                      style={{
                        marginTop: 4, padding: "8px 18px",
                        background: "#2563EB", color: "#fff",
                        border: "none", borderRadius: 8, cursor: "pointer",
                        fontFamily: "Inter", fontWeight: 600, fontSize: 13,
                      }}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* QR refresh info */}
            <div className="w-full flex justify-center mt-auto px-4">
              <div
                style={{
                  width: '100%', maxWidth: 317,
                  background: "rgba(255,255,255,0.1)", borderRadius: 18,
                  padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <RefreshCw
                  size={20}
                  className={cn("text-white/80 shrink-0", isLoading || countdown <= 5 ? "animate-spin" : "")}
                  onClick={isError ? refreshQrCode : undefined}
                  style={isError ? { cursor: "pointer" } : undefined}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 'clamp(11px, 2vw, 14px)', lineHeight: "20px", color: "#fff", margin: 0 }}>QR code refreshes automatically</p>
                  <p className="truncate" style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 'clamp(11px, 2vw, 14px)', lineHeight: "20px", color: "#BEDBFF", margin: 0 }}>
                    {isLoading
                      ? "Loading…"
                      : isError
                      ? <span style={{ color: "#FCA5A5" }}>Connection error — click refresh</span>
                      : isSuccess
                      ? <span style={{ color: "#86EFAC" }}>Logged in! Redirecting…</span>
                      : <>Expires in <strong style={{ fontWeight: 700, color: "#fff" }}>{formatTime(countdown)}</strong></>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── PHONE LOGIN BUTTON ── */}
          <div className="w-full flex justify-center mt-[10px] lg:mt-8">
            <button
              onClick={() => router.push("/choose-mode")}
              style={{
                width: '100%', maxWidth: 458, height: 56,
                background: "#155DFC", borderRadius: 16,
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0px 2px 4px -2px rgba(0,0,0,.1),0px 4px 6px -1px rgba(0,0,0,.1)",
              }}
            >
              <Phone size={20} fill="#fff" color="#fff" />
              <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 16, lineHeight: "24px", color: "#fff" }}>
                Log in with phone number
              </span>
            </button>
          </div>

          {/* ── E2E TEXT ── */}
          <div className="w-full flex justify-center xl:justify-center mt-4 lg:mt-[50px] mb-8 lg:mb-0" style={{ paddingLeft: "10%" }}>
            <p
              className="text-center xl:text-left"
              style={{
                width: '100%', maxWidth: 211, height: 15,
                fontFamily: "Inter", fontWeight: 400, fontSize: 9, color: "#102A63",
                margin: 0
              }}
            >
              End-to-end encrypted - Your data stays private
            </p>
          </div>
        </div>
      </main>

      {/* ── HELP WIDGET ── */}
      <div className="fixed z-50" style={{ bottom: 24, right: 24, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        {isHelpOpen && (
          <div
            style={{
              width: 146, background: "#fff",
              border: "1px solid #E8E8E8", borderRadius: 16,
              boxShadow: "4px 4px 23.3px 0px rgba(0,0,0,0.19)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              paddingBottom: 8,
            }}
          >
            {/* Need help heading */}
            <div style={{ padding: "12px 22px 8px" }}>
              <span style={{ fontFamily: "Roboto", fontWeight: 700, fontSize: 20, color: "#102A63" }}>Need help?</span>
            </div>
            {/* Live Chat */}
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer" }}>
              <MessageSquare size={24} color="#102A63" />
              <span style={{ fontFamily: "Roboto", fontWeight: 500, fontSize: 12, color: "#102A63" }}>Live Chat</span>
            </button>
            {/* Help Center */}
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer" }}>
              <HelpCircle size={21} color="#102A63" />
              <span style={{ fontFamily: "Roboto", fontWeight: 500, fontSize: 12, color: "#102A63" }}>Help Center</span>
            </button>
            {/* Email support */}
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer" }}>
              <Mail size={18} color="#102A63" />
              <span style={{ fontFamily: "Roboto", fontWeight: 500, fontSize: 12, color: "#102A63" }}>Email support</span>
            </button>
            {/* SMS / chat FAB inside panel */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
              <div
                style={{
                  width: 48, height: 48,
                  background: "#155DFC", borderRadius: 9999,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0px 4px 6px -4px rgba(0,0,0,.1),0px 10px 15px -3px rgba(0,0,0,.1)",
                }}
              >
                <MessageCircle size={24} fill="#fff" color="#fff" />
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          style={{
            width: 48, height: 48,
            background: "#155DFC", borderRadius: 9999, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0px 4px 6px -4px rgba(0,0,0,.1),0px 10px 15px -3px rgba(0,0,0,.1)",
          }}
        >
          <MessageCircle size={24} fill="#fff" color="#fff" />
        </button>
      </div>
    </div>
  );
}
