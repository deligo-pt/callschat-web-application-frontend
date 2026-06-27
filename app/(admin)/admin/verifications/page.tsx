"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Eye, 
  ShieldCheck, 
  Clock, 
  Building2, 
  AlertCircle,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface BusinessVerification {
  id: string;
  businessName: string;
  ownerId: string;
  ownerEmail: string;
  category: string;
  submissionDate: string;
  documentUrl: string;
  documentType: string;
  taxId: string;
  isVerified: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

export default function VerificationsQueuePage() {
  const [verifications, setVerifications] = useState<BusinessVerification[]>([
    {
      id: "VER-1001",
      businessName: "TechNova Solutions LLC",
      ownerId: "USR-882190",
      ownerEmail: "founder@technova.io",
      category: "Software & IT",
      submissionDate: "2026-06-27 10:14 AM",
      documentUrl: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=800&auto=format&fit=crop",
      documentType: "Articles of Incorporation & IRS SS-4",
      taxId: "84-2910492",
      isVerified: false,
      status: "PENDING",
    },
    {
      id: "VER-1002",
      businessName: "Apex Financial Advisory",
      ownerId: "USR-441920",
      ownerEmail: "compliance@apexfin.com",
      category: "Finance & Fintech",
      submissionDate: "2026-06-27 09:30 AM",
      documentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
      documentType: "FinCEN Registration & Certificate of Good Standing",
      taxId: "12-9938102",
      isVerified: false,
      status: "PENDING",
    },
    {
      id: "VER-1003",
      businessName: "Global Logistics Corp",
      ownerId: "USR-771234",
      ownerEmail: "ops@globallogistics.net",
      category: "Supply Chain",
      submissionDate: "2026-06-26 04:45 PM",
      documentUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
      documentType: "Business License & DOT Certification",
      taxId: "45-1029384",
      isVerified: false,
      status: "PENDING",
    },
    {
      id: "VER-1004",
      businessName: "GreenLeaf Organic Cafe",
      ownerId: "USR-339102",
      ownerEmail: "hello@greenleafcafe.com",
      category: "Food & Hospitality",
      submissionDate: "2026-06-26 02:15 PM",
      documentUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=800&auto=format&fit=crop",
      documentType: "Municipal Food Service Permit & EIN Letter",
      taxId: "91-3847102",
      isVerified: false,
      status: "PENDING",
    },
  ]);

  const [selectedDoc, setSelectedDoc] = useState<BusinessVerification | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: string]: string }>({});
  const [customReason, setCustomReason] = useState<string>("");

  const predefinedReasons = [
    "Invalid or Expired Document",
    "Mismatched Business Name / Tax ID",
    "Illegible or Blurred Scan",
    "Unsupported Business Category",
    "Suspected Fraudulent Document",
  ];

  const handleApprove = (id: string) => {
    setVerifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isVerified: true, status: "APPROVED" } : item
      )
    );
    toast.success(`Business approved and verified successfully!`, {
      description: `Verification status updated to verified in the identity registry.`,
    });
  };

  const handleReject = (id: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please select or enter a rejection reason.");
      return;
    }
    setVerifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isVerified: false, status: "REJECTED", rejectionReason: reason } : item
      )
    );
    toast.error(`Verification Rejected`, {
      description: `Reason: ${reason}. Notification sent to business owner.`,
    });
  };

  const pendingCount = verifications.filter((v) => v.status === "PENDING").length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header & Stats Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Business Verification Queue
            </h1>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
              {pendingCount} Pending
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Review compliance attachments, verify tax identification numbers, and process merchant onboardings.
          </p>
        </div>
      </div>

      {/* Dense Data Table Container */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Business Name & Category</th>
                <th className="py-3.5 px-4">Owner ID & Contact</th>
                <th className="py-3.5 px-4">Submission Date</th>
                <th className="py-3.5 px-4">Document Attachment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {verifications.map((item) => (
                <tr 
                  key={item.id} 
                  className={`transition-colors hover:bg-slate-800/40 ${item.status !== "PENDING" ? "opacity-60 bg-slate-900/20" : ""}`}
                >
                  {/* Business Name & Category */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                          {item.businessName}
                          {item.isVerified && (
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          {item.category} · <span className="font-mono text-slate-500">EIN: {item.taxId}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Owner ID & Contact */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="font-mono text-xs font-semibold text-slate-300">{item.ownerId}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[160px]">{item.ownerEmail}</div>
                  </td>

                  {/* Submission Date */}
                  <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{item.submissionDate}</span>
                    </div>
                  </td>

                  {/* Document Attachment (Clickable Viewer Trigger) */}
                  <td className="py-3.5 px-4 align-middle">
                    <button
                      onClick={() => setSelectedDoc(item)}
                      className="group inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/20 hover:border-indigo-500/40 transition-all shadow-xs"
                    >
                      <FileText className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="truncate max-w-[150px]">View KYC Doc</span>
                      <Eye className="h-3 w-3 opacity-60" />
                    </button>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                    {item.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30 animate-pulse">
                        <Clock className="h-3 w-3" /> Pending Review
                      </span>
                    )}
                    {item.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </span>
                    )}
                    {item.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-400 border border-rose-500/30" title={item.rejectionReason}>
                        <XCircle className="h-3 w-3" /> Rejected
                      </span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                    {item.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-2">
                        {/* Approve Button */}
                        <Button
                          size="xs"
                          onClick={() => handleApprove(item.id)}
                          className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold px-3 shadow-sm"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                        </Button>

                        {/* Reject Popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              size="xs"
                              variant="destructive"
                              className="font-bold px-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                            >
                              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 border-slate-700 bg-[#111827] text-slate-100 p-4 shadow-2xl" align="end">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                                <AlertCircle className="h-4 w-4" />
                                <span>Select Rejection Reason</span>
                              </div>
                              <p className="text-xs text-slate-400">
                                This reason will be emailed to <span className="font-mono text-slate-300">{item.ownerEmail}</span>.
                              </p>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {predefinedReasons.map((reason) => (
                                  <button
                                    key={reason}
                                    onClick={() => handleReject(item.id, reason)}
                                    className="w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700"
                                  >
                                    • {reason}
                                  </button>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                                <input
                                  type="text"
                                  placeholder="Or enter custom reason..."
                                  value={rejectionReasons[item.id] || ""}
                                  onChange={(e) => setRejectionReasons({ ...rejectionReasons, [item.id]: e.target.value })}
                                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                                />
                                <Button
                                  size="xs"
                                  variant="destructive"
                                  onClick={() => handleReject(item.id, rejectionReasons[item.id] || "Application did not meet compliance criteria")}
                                  className="w-full bg-rose-600 text-white hover:bg-rose-500 font-bold"
                                >
                                  Submit Custom Rejection
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-slate-500 italic">
                        Processed ({item.status})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-3xl border-slate-800 bg-[#111827] text-slate-100 p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              <DialogTitle className="text-lg font-bold text-white">
                KYC Document Verification Preview
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-400">
              Reviewing compliance records submitted by <span className="font-semibold text-slate-200">{selectedDoc?.businessName}</span> ({selectedDoc?.ownerId}).
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4 my-2">
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-900/80 p-4 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Document Classification:</span>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedDoc.documentType}</p>
                </div>
                <div>
                  <span className="text-slate-400">Tax Identification Number (EIN):</span>
                  <p className="font-mono font-bold text-indigo-400 mt-0.5">{selectedDoc.taxId}</p>
                </div>
              </div>

              {/* Secure Document Preview Frame */}
              <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black/40 p-2 flex items-center justify-center min-h-[350px]">
                <div className="absolute top-3 right-3 rounded bg-black/80 px-2 py-1 text-[10px] font-mono text-emerald-400 border border-emerald-500/30 z-10">
                  SECURE WATERMARK ACTIVE
                </div>
                {/* Simulated Document Preview */}
                <div className="w-full h-[380px] rounded-lg bg-slate-900 border border-slate-700/50 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/10 pointer-events-none" />
                  <FileText className="h-16 w-16 text-indigo-400/40 mb-4" />
                  <h4 className="text-base font-bold text-slate-200">{selectedDoc.businessName}</h4>
                  <p className="text-xs font-mono text-slate-400 mt-1">OFFICIAL VERIFICATION CERTIFICATE</p>
                  <div className="mt-6 border-t border-slate-800 pt-4 w-3/4 max-w-sm text-left font-mono text-[11px] text-slate-400 space-y-1">
                    <p>REGISTERED OWNER: {selectedDoc.ownerEmail}</p>
                    <p>STATUS: VERIFIED IN STATE REGISTRY</p>
                    <p>TIMESTAMP: {selectedDoc.submissionDate}</p>
                    <p>DIGITAL SIGNATURE: 0x892a...f91c</p>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <a 
                      href={selectedDoc.documentUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md"
                    >
                      Open Full Resolution Image ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-slate-800 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDoc(null)}
              className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
            >
              Close Viewer
            </Button>
            {selectedDoc?.status === "PENDING" && (
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => {
                    handleApprove(selectedDoc.id);
                    setSelectedDoc(null);
                  }}
                  className="bg-emerald-600 text-white hover:bg-emerald-500 font-bold"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve & Verify
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
