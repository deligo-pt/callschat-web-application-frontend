"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Moon, Globe, RefreshCw, Phone, MessageSquare, HelpCircle, Mail, MessageCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

export default function WebLoginScreen() {
  const router = useRouter();
  const [countdown, setCountdown] = React.useState(25);
  const [qrValue, setQrValue] = React.useState("callschat-login-token-1");
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setQrValue(`callschat-login-token-${Date.now()}`);
          return 25;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => `00:${s.toString().padStart(2, "0")}`;

  return (
    <div className="relative min-h-screen w-full bg-white font-sans overflow-hidden">

      {/* Background SVG pattern */}
      <img
        src="/figma/bg_pattern.svg"
        alt=""
        className="absolute pointer-events-none select-none"
        style={{ left: -336, top: 374, width: 1312, height: 1182, opacity: 0.77 }}
      />

      {/* Top-right subtract decoration */}
      <img
        src="/figma/subtract_decor.svg"
        alt=""
        className="absolute pointer-events-none select-none"
        style={{ right: 0, top: 0, width: 251, height: 259, opacity: 0.5, color: "#C7DFFE" }}
      />

      {/* ── NAVBAR ── */}
      <header
        className="absolute top-0 w-full z-20 flex items-center justify-between"
        style={{ height: 64, paddingLeft: 43, paddingRight: 43, borderBottom: "0.667px solid #F3F4F6", background: "#fff", boxShadow: "0px 1px 2px -1px rgba(0,0,0,.1),0px 1px 3px 0px rgba(0,0,0,.1)" }}
      >
        {/* Logo */}
        <div className="flex items-center" style={{ gap: -8 }}>
          <Image src="/call_chats_logo.png" alt="CallsChat" width={79} height={57} className="object-contain" />
          <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 23.75, lineHeight: 1 }}>
            <span style={{ color: "#02235F" }}>Calls</span>
            <span style={{ color: "#037CFD" }}>Chat</span>
          </span>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center" style={{ gap: 12 }}>
          {/* Dark mode toggle */}
          <button
            className="flex items-center"
            style={{ gap: 10, padding: "8px 12px", border: "0.667px solid #B5B5B5", borderRadius: 18 }}
          >
            <Moon size={16} style={{ color: "#364153" }} />
            <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#364153", lineHeight: "19.5px" }}>
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
            <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#364153", lineHeight: "19.5px" }}>
              English
            </span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#364153" strokeWidth={2}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── 1440px design */}
      <div className="relative w-full" style={{ maxWidth: 1440, margin: "0 auto", paddingTop: 64 }}>

        {/* ── LEFT: Marketing copy at x=68, y=105 ── */}
        <div className="absolute" style={{ left: 68, top: 105, width: 503 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: -10 }}>
            <p style={{ fontFamily: "Roboto", fontWeight: 700, fontSize: 56, lineHeight: "1.2em", color: "#101828", margin: 0 }}>
              The future of
            </p>
            <p style={{ fontFamily: "Roboto", fontWeight: 700, fontSize: 56, lineHeight: "1.2em", color: "#155DFC", margin: 0, paddingTop: 8 }}>
              secure messaging
            </p>
          </div>
          <div style={{ paddingTop: 20 }}>
            <p style={{ fontFamily: "Roboto", fontWeight: 400, fontSize: 20, lineHeight: "1.2em", color: "#6A7282", width: 448, margin: 0 }}>
              AI-powered conversations with end-to-end encryption. Connect across devices seamlessly — your privacy, your control, your conversations.
            </p>
          </div>
        </div>

        {/* ── FEATURE CARDS  x=43, y=378 ── */}
        <div
          className="absolute flex justify-center"
          style={{ left: 43, top: 378, width: 565, height: 122.66, gap: 22.18 }}
        >
          {/* E2E Encrypted */}
          <div
            style={{ width: 157.89, height: 117.44, background: "#fff", border: "1.305px solid #2563EB", borderRadius: 10.44, position: "relative" }}
          >
            <Image src="/figma/icon_e2e.png" alt="E2E" width={18} height={22} style={{ position: "absolute", left: 24.79, top: 26.1, objectFit: "cover" }} />
            <span style={{ position: "absolute", left: 18.27, top: 60.02, fontFamily: "Inter", fontWeight: 700, fontSize: 14.35, color: "#2563EB" }}>E2E Encrypted</span>
            <span style={{ position: "absolute", left: 19.57, top: 82.21, fontFamily: "Inter", fontWeight: 300, fontSize: 13.05, color: "#2563EB" }}>Military-grade</span>
          </div>

          {/* AI-Powered (selected/elevated) */}
          <div style={{ width: 165.72, height: 122.66, position: "relative", borderRadius: 10.44 }}>
            {/* dark bg shadow layer */}
            <div style={{ position: "absolute", left: 6.53, top: 6.52, width: 153.97, height: 110.91, background: "#131928", border: "1.305px solid #222836", borderRadius: 13.05 }} />
            {/* white card on top */}
            <div style={{ position: "absolute", left: 3.92, top: 0, width: 157.89, height: 117.44, background: "#fff", border: "1.305px solid #2563EB", borderRadius: 10.44 }}>
              <Image src="/figma/icon_ai.png" alt="AI" width={22} height={22} style={{ position: "absolute", left: 23.49, top: 26.1, objectFit: "cover" }} />
              <span style={{ position: "absolute", left: 16.96, top: 61.33, fontFamily: "Inter", fontWeight: 400, fontSize: 14.35, color: "#2563EB" }}>AI-Powered</span>
              <span style={{ position: "absolute", left: 18.27, top: 82.21, fontFamily: "Inter", fontWeight: 300, fontSize: 11.74, color: "#2563EB" }}>Smart replies</span>
            </div>
          </div>

          {/* Instant Sync */}
          <div
            style={{ width: 157.89, height: 117.44, background: "#fff", border: "1.305px solid #2563EB", borderRadius: 10.44, position: "relative" }}
          >
            <Image src="/figma/icon_sync.png" alt="Sync" width={14} height={21} style={{ position: "absolute", left: 27.4, top: 27.4, objectFit: "cover" }} />
            <span style={{ position: "absolute", left: 19.57, top: 61.33, fontFamily: "Inter", fontWeight: 700, fontSize: 13.05, color: "#2563EB" }}>Instant Sync</span>
            <span style={{ position: "absolute", left: 18.27, top: 82.21, fontFamily: "Inter", fontWeight: 400, fontSize: 11.74, color: "#2563EB" }}>All devices</span>
          </div>
        </div>

        {/* ── APP DOWNLOAD CARD  positioned inside blue panel area on left ── */}
        {/* Per Figma: Container #1927:1318 at x:-638,y:412 relative to the blue panel (x=784,y=115) → absolute left = 784-638=146, top = 115+412=527 */}
        <div
          className="absolute"
          style={{
            left: 146, top: 527, width: 402,
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
          <div style={{ display: "flex", gap: 12, height: 55 }}>
            {/* Google Play */}
            <button
              style={{ display: "flex", alignItems: "center", gap: 8, width: 188, padding: "10px 16px", border: "2px solid #E5E7EB", borderRadius: 18, background: "transparent" }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="#6A7282"><path d="M4 2v20l17-10z" /></svg>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 9, lineHeight: "13.5px", color: "#6A7282" }}>GET IT ON</span>
                <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, lineHeight: "17.5px", color: "#101828" }}>Google Play</span>
              </div>
            </button>
            {/* App Store */}
            <button
              style={{ display: "flex", alignItems: "center", gap: 8, width: 158, padding: "10px 16px", border: "2px solid #E5E7EB", borderRadius: 18, background: "transparent" }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="#6A7282"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.55-.83 2.12-.13 3.7.83 4.73 2.3-3.89 2.28-3.11 7.16.8 8.61-1.02 2.59-2.24 4.89-4.16 6.74zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.02 4.41-3.74 4.25z" /></svg>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 9, lineHeight: "13.5px", color: "#6A7282" }}>Download on the</span>
                <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 14, lineHeight: "17.5px", color: "#101828" }}>App Store</span>
              </div>
            </button>
          </div>
        </div>

        {/* ── PHONE MOCKUPS  x:-680,y:580 relative to blue panel → left=784-680=104, top=115+580=695 ── */}
        <div className="absolute hidden lg:block" style={{ left: 104, top: 695, width: 295, height: 326 }}>
          {/* Back phone */}
          <Image
            src="/figma/phone_back.png"
            alt="Phone back"
            width={187}
            height={309}
            style={{ position: "absolute", left: 108, top: 8, objectFit: "cover", borderRadius: 24 }}
          />
          {/* Front phone */}
          <Image
            src="/figma/phone_front.png"
            alt="Phone front"
            width={165}
            height={326}
            style={{ position: "absolute", left: 0, top: 0, objectFit: "cover", borderRadius: 24, boxShadow: "6.15px 3.08px 19.76px 7.69px rgba(0,0,0,0.11)" }}
          />
        </div>

        {/* ── RIGHT: Blue QR Login Panel  x=784, y=115 ── */}
        <div
          className="absolute"
          style={{
            left: 784, top: 115,
            width: 519, height: 642,
            background: "linear-gradient(224deg, rgba(8,46,121,1) 0%, rgba(11,63,165,1) 65%, rgba(15,85,223,1) 100%)",
            borderRadius: 16,
          }}
        >
          {/* Instructions block  x=57, y=70 */}
          <div style={{ position: "absolute", left: 57, top: 70, width: 206, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 19, color: "#fff", lineHeight: "25px" }}>Scan to log in</span>
              <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 11, color: "#fff", lineHeight: "17px" }}>Use your CallsChat mobile app to scan</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { num: "1", text: "Open CallsChat on your phone", numColor: "#CAE3FB" },
                { num: "2", text: "Tap Menu → Linked Devices", numColor: "#CDE4FB" },
                { num: "3", text: "Point your camera at this screen", numColor: "#CBE3FB" },
              ].map(({ num, text, numColor }) => (
                <div key={num} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 28, height: 27, borderRadius: 6, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 10, color: numColor }}>{num}</span>
                  </div>
                  <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 11, color: "#fff" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QR Code box  x=94, y=263  w=311 h=275 */}
          <div
            style={{
              position: "absolute", left: 94, top: 263,
              width: 311, height: 275,
              background: "#fff", borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "7px 24px",
            }}
          >
            <div style={{ position: "relative", width: 263, height: 263, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <QRCode value={qrValue} size={263} fgColor="#2563EB" level="Q" style={{ width: "100%", height: "100%" }} />
              {/* Logo overlay: white circle 65x62 at x=97,y=96 inside 263x263 */}
              <div style={{ position: "absolute", left: 97, top: 96, width: 65, height: 62, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 62, height: 62, borderRadius: 9999, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Image src="/call_chats_logo.png" alt="Logo" width={58} height={42} style={{ objectFit: "contain" }} />
                </div>
              </div>
            </div>
          </div>

          {/* QR refresh info  x=104, y=552  w=317 */}
          <div
            style={{
              position: "absolute", left: 104, top: 552,
              width: 317,
              background: "rgba(255,255,255,0.1)", borderRadius: 18,
              padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <RefreshCw size={20} className={cn("text-white/80", countdown <= 5 ? "animate-spin" : "")} />
            <div>
              <p style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 14, lineHeight: "20px", color: "#fff", margin: 0 }}>QR code refreshes automatically</p>
              <p style={{ fontFamily: "Inter", fontWeight: 400, fontSize: 14, lineHeight: "20px", color: "#BEDBFF", margin: 0 }}>
                Expires in <strong style={{ fontWeight: 700, color: "#fff" }}>{formatTime(countdown)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ── PHONE LOGIN BUTTON  x=815, y=771  w=458 h=56 ── */}
        <button
          onClick={() => router.push("/choose-mode")}
          style={{
            position: "absolute", left: 815, top: 771,
            width: 458, height: 56,
            background: "#155DFC", borderRadius: 16,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: "0px 2px 4px -2px rgba(0,0,0,.1),0px 4px 6px -1px rgba(0,0,0,.1)",
          }}
        >
          <Phone size={20} fill="#fff" color="#fff" />
          <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 16, lineHeight: "24px", color: "#fff" }}>
            Log in with phone number
          </span>
        </button>

        {/* ── E2E TEXT  x=938, y=877 ── */}
        <p
          style={{
            position: "absolute", left: 938, top: 877,
            width: 211, height: 15,
            fontFamily: "Inter", fontWeight: 400, fontSize: 9, color: "#102A63",
            margin: 0,
          }}
        >
          End-to-end encrypted - Your data stays private
        </p>
      </div>

      {/* Page minimum height spacer */}
      <div style={{ height: 960 }} />

      {/* ── HELP WIDGET  fixed bottom-right x=1280,y=768 → fixed:right=160,bottom=232 on 1440 ── */}
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
