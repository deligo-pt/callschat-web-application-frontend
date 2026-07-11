"use client";

import React from "react";
import { useProfile } from "@/context/ProfileContext";
import { Camera, Loader2, Edit2, UserCircle2, ArrowLeft, ShieldCheck, Pencil, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfileEditPage() {
  const router = useRouter();
  const {
    formData,
    setFormData,
    avatarPreview,
    fileInputRef,
    handleImageSelect,
    handleSaveProfile,
    isPending,
    isLoading,
    activeMode,
    businessProfile,
  } = useProfile();

  if (activeMode === "BUSINESS") {
    return (
      <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden relative h-full">
        {/* Top Bright Blue Header */}
        <div className="bg-[#2563EB] py-4 px-6 md:px-8 flex items-center gap-3 text-white shrink-0 shadow-sm">
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-[18px] md:text-[20px] font-bold tracking-wide">Profile</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center scrollbar-hide">
          <div className="w-full max-w-[560px] flex flex-col items-center">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-20 w-20 md:h-24 md:w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-slate-100 border-2 border-white shadow-md transition-transform hover:scale-105"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Picture" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-12 w-12 text-slate-400" strokeWidth={1.5} />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 flex items-center gap-1.5 text-[13px] md:text-[14px] font-bold text-[#2563EB] hover:underline"
              >
                <Camera className="h-4 w-4" />
                Picture
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
            </div>

            {/* Card 1: BASIC INFORMATION */}
            <div className="w-full rounded-[24px] border border-[#E6EAFA] bg-white p-6 md:p-8 shadow-xs flex flex-col gap-5 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold tracking-wider text-[#8F95B2] uppercase">BASIC INFORMATION</h3>
                {activeMode === "BUSINESS" && businessProfile?.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2563EB] text-white px-2.5 py-0.5 text-[10px] font-bold shadow-xs">
                    <ShieldCheck className="h-3 w-3" /> Verified Badge Active
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-[#64748B]">Business Name</label>
                <div className="flex h-[46px] w-full items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10">
                  <input
                    type="text"
                    value={formData.companyName || formData.displayName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value, displayName: e.target.value })}
                    placeholder="Enter business name"
                    className="w-full bg-transparent text-[13px] font-semibold text-[#0F172A] focus:outline-none placeholder:text-slate-400"
                  />
                  <Pencil className="h-4 w-4 text-[#2563EB] shrink-0 ml-2 cursor-pointer" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-[#64748B]">Business Category</label>
                <div className="relative flex h-[46px] w-full items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-transparent text-[13px] font-semibold text-[#0F172A] focus:outline-none appearance-none cursor-pointer pr-6"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Retail & E-commerce">Retail & E-commerce</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Media & Entertainment">Media & Entertainment</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-[#64748B]">Business Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what your business does..."
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-[13px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>
            </div>

            {/* Card 2: CONTACT INFORMATION */}
            <div className="w-full rounded-[24px] border border-[#E6EAFA] bg-white p-6 md:p-8 shadow-xs flex flex-col gap-5 mb-8">
              <h3 className="text-[11px] font-bold tracking-wider text-[#8F95B2] uppercase">CONTACT INFORMATION</h3>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-[#64748B]">Business Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="h-[46px] w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-[13px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-[#64748B]">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your number"
                  className="h-[46px] w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-[13px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-[#64748B]">Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="Enter your web link"
                  className="h-[46px] w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 text-[13px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="w-full pb-12 flex justify-center">
              <button
                onClick={handleSaveProfile}
                disabled={isPending || isLoading}
                className="flex h-[48px] w-full items-center justify-center rounded-xl bg-[#2563EB] text-[14px] font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Change"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center overflow-y-auto scrollbar-hide py-16 h-full">
      <div className="w-full max-w-[440px] flex flex-col px-6">
        {/* Avatar Edit */}
        <div className="flex flex-col items-center mb-10">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-[100px] w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#EEF2FF] border border-[#E0E7FF] transition-transform hover:scale-105"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 className="h-12 w-12 text-slate-400" strokeWidth={1.5} />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-[#2563EB] hover:underline"
          >
            <Camera className="h-3.5 w-3.5" />
            Picture
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-5 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#0F172A]">Name</label>
            <div className="relative">
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="h-[46px] w-full rounded-xl border border-transparent bg-[#F8FAFC] px-4 text-[13px] font-medium text-slate-800 focus:border-blue-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="User"
              />
              <Edit2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#0F172A]">Phone</label>
            <input
              type="text"
              value={formData.phone}
              readOnly
              className="h-[46px] w-full rounded-xl border border-transparent bg-[#F8FAFC] px-4 text-[13px] font-medium text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#0F172A]">Email</label>
            <div className="relative">
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Not set"
                className="h-[46px] w-full rounded-xl border border-transparent bg-[#F8FAFC] px-4 text-[13px] font-medium text-slate-800 focus:border-blue-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <Edit2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" />
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSaveProfile}
              disabled={isPending || isLoading}
              className="flex h-10 w-36 items-center justify-center rounded-full bg-[#2563EB] text-[13px] font-bold text-white shadow-sm hover:bg-blue-700 transition-all"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Change"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
