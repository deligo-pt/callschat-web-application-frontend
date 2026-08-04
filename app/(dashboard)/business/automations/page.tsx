"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Zap,
  Plus,
  Trash2,
  ArrowLeft,
  Bot,
  MessageSquare,
  Sparkles,
  Loader2,
  CheckCircle2,
  KeyRound,
  Clock,
} from "lucide-react";

import { useUser } from "@/context/UserContext";
import { AutomationService, AutomationRule, QuickReply, AutomationType } from "@/services/automation.service";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Form schemas & interfaces
interface QuickReplyForm {
  shortcut: string;
  content: string;
}

interface RuleForm {
  type: AutomationType;
  keyword: string;
  responseMessage: string;
}

export default function BusinessAutomationsPage() {
  const router = useRouter();
  const { workspace, refetchQuickReplies } = useUser();

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isQuickReplyDialogOpen, setIsQuickReplyDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // React Hook Forms
  const quickReplyForm = useForm<QuickReplyForm>({
    defaultValues: { shortcut: "/", content: "" },
  });

  const ruleForm = useForm<RuleForm>({
    defaultValues: { type: "GREETING", keyword: "", responseMessage: "" },
  });

  const selectedRuleType = ruleForm.watch("type");

  // Fetch automations
  const fetchAutomationsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AutomationService.getAutomations(workspace?.id);
      if (res.success) {
        setRules(res.data.rules || []);
        setQuickReplies(res.data.quickReplies || []);
      }
    } catch {
      toast.error("Failed to load customer automations");
    } finally {
      setLoading(false);
    }
  }, [workspace?.id]);

  useEffect(() => {
    fetchAutomationsData();
  }, [fetchAutomationsData]);

  // Toggle rule state
  const handleToggleRule = async (rule: AutomationRule) => {
    const nextStatus = !rule.isActive;
    // Optimistic update
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: nextStatus } : r)));
    try {
      const res = await AutomationService.toggleRule(rule.id, nextStatus, workspace?.id);
      if (res.success) {
        toast.success(`Rule ${nextStatus ? "activated" : "deactivated"}`);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to update rule status");
      // Revert
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: !nextStatus } : r)));
    }
  };

  // Create rule submit
  const onCreateRuleSubmit = async (data: RuleForm) => {
    if (!data.responseMessage.trim()) {
      toast.error("Response message is required");
      return;
    }
    if (data.type === "KEYWORD" && !data.keyword.trim()) {
      toast.error("Keyword is required for keyword trigger rules");
      return;
    }

    setSubmitting(true);
    try {
      const res = await AutomationService.createRule({
        type: data.type,
        keyword: data.type === "KEYWORD" ? data.keyword.trim() : undefined,
        responseMessage: data.responseMessage.trim(),
        workspaceId: workspace?.id,
      });
      if (res.success) {
        toast.success("Automation rule created successfully");
        setIsRuleDialogOpen(false);
        ruleForm.reset({ type: "GREETING", keyword: "", responseMessage: "" });
        fetchAutomationsData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to create automation rule");
    } finally {
      setSubmitting(false);
    }
  };

  // Create quick reply submit
  const onCreateQuickReplySubmit = async (data: QuickReplyForm) => {
    let shortcut = data.shortcut.trim();
    if (!shortcut) {
      toast.error("Shortcut name is required");
      return;
    }
    if (!shortcut.startsWith("/")) {
      shortcut = "/" + shortcut;
    }
    if (!data.content.trim()) {
      toast.error("Response message content is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await AutomationService.createQuickReply({
        shortcut,
        content: data.content.trim(),
        workspaceId: workspace?.id,
      });
      if (res.success) {
        toast.success("Quick reply shortcut created");
        setIsQuickReplyDialogOpen(false);
        quickReplyForm.reset({ shortcut: "/", content: "" });
        fetchAutomationsData();
        void refetchQuickReplies();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to create quick reply");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete quick reply
  const handleDeleteQuickReply = async (id: string) => {
    // Optimistic update
    setQuickReplies((prev) => prev.filter((q) => q.id !== id));
    try {
      const res = await AutomationService.deleteQuickReply(id, workspace?.id);
      if (res.success) {
        toast.success("Shortcut deleted");
        void refetchQuickReplies();
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to delete shortcut");
      fetchAutomationsData();
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#F8FAFC] p-6 md:p-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-gradient-to-r from-[#1D2A54] via-[#2E1065] to-[#4C1D95] p-8 rounded-3xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/business/dashboard")}
            className="rounded-full p-2.5 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-400/20 px-3 py-0.5 text-xs font-bold text-purple-200 border border-purple-400/30">
                <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                Intelligent Support Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Customer Automations</h1>
            <p className="mt-1 text-sm text-purple-200 max-w-xl">
              Configure system auto-replies for new customer tickets and manage instant slash shortcuts for your agent team.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="rules" className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-white p-1.5 border border-[#E6EAFA] shadow-xs rounded-2xl">
            <TabsTrigger value="rules" className="rounded-xl px-5 py-2 font-bold text-sm">
              <Bot className="h-4 w-4 mr-2 text-purple-600" />
              Auto-Replies (System Rules)
            </TabsTrigger>
            <TabsTrigger value="quick-replies" className="rounded-xl px-5 py-2 font-bold text-sm">
              <Zap className="h-4 w-4 mr-2 text-emerald-600" />
              Quick Replies (Agent Shortcuts)
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: AUTO REPLIES */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[#E6EAFA] shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-[#1D2A54]">Active Workflow Triggers</h2>
              <p className="text-xs text-[#8F95B2]">
                Rules automatically intercept incoming customer messages before notifying agents.
              </p>
            </div>
            <Button
              onClick={() => setIsRuleDialogOpen(true)}
              className="rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold px-5 py-2.5 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Rule
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E6EAFA] text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-600 mb-4">
                <Bot className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1D2A54]">No Automation Rules Configured</h3>
              <p className="text-sm text-[#8F95B2] max-w-md mx-auto mt-1 mb-6">
                Set up automated greeting messages or keyword responders to engage customers instantly when they open a ticket.
              </p>
              <Button
                onClick={() => setIsRuleDialogOpen(true)}
                className="rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer"
              >
                Create Your First Rule
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-white p-6 rounded-3xl border border-[#E6EAFA] shadow-xs transition-all hover:shadow-md flex flex-col justify-between gap-4 relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${rule.isActive ? "bg-purple-600" : "bg-slate-300"}`} />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center gap-1.5">
                          {rule.type === "GREETING" && <MessageSquare className="h-3 w-3" />}
                          {rule.type === "AWAY" && <Clock className="h-3 w-3" />}
                          {rule.type === "KEYWORD" && <KeyRound className="h-3 w-3" />}
                          {rule.type}
                        </span>
                        {rule.keyword && (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-[#1D2A54] font-mono text-xs font-bold">
                            match: &quot;{rule.keyword}&quot;
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${rule.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                          {rule.isActive ? "Active" : "Disabled"}
                        </span>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggleRule(rule)}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="mt-2 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E6EAFA]">
                      <p className="text-xs font-bold text-[#8F95B2] uppercase tracking-wider mb-1">Automated Response:</p>
                      <p className="text-sm text-[#1D2A54] leading-relaxed font-medium">{rule.responseMessage}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-[#8F95B2]">
                    <span>Created {new Date(rule.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Interceptor Ready
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: QUICK REPLIES */}
        <TabsContent value="quick-replies" className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[#E6EAFA] shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-[#1D2A54]">Agent Slash Shortcuts</h2>
              <p className="text-xs text-[#8F95B2]">
                Agents can type forward slash (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-purple-600 font-bold">/pricing</code>) in the input to expand snippets.
              </p>
            </div>
            <Button
              onClick={() => setIsQuickReplyDialogOpen(true)}
              className="rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-bold px-5 py-2.5 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> New Shortcut
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : quickReplies.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E6EAFA] text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1D2A54]">No Quick Replies Available</h3>
              <p className="text-sm text-[#8F95B2] max-w-md mx-auto mt-1 mb-6">
                Create shortcuts for common questions like refund policies, business hours, or pricing tables to save team typing time.
              </p>
              <Button
                onClick={() => setIsQuickReplyDialogOpen(true)}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                Create Shortcut
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E6EAFA] shadow-xs overflow-hidden">
              <Table>
                <TableHeader bg-slate-50>
                  <TableRow>
                    <TableHead className="w-[180px] font-bold text-[#1D2A54]">Shortcut Trigger</TableHead>
                    <TableHead className="font-bold text-[#1D2A54]">Expanded Message Content</TableHead>
                    <TableHead className="w-[120px] text-right font-bold text-[#1D2A54]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quickReplies.map((qr) => (
                    <TableRow key={qr.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono font-bold text-purple-600 text-sm">
                        <span className="bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                          {qr.shortcut}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[#1D2A54] leading-relaxed max-w-xl font-medium">
                        {qr.content}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleDeleteQuickReply(qr.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete shortcut"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DIALOG 1: CREATE RULE */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border border-[#E6EAFA]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1D2A54]">Create Automation Rule</DialogTitle>
            <DialogDescription className="text-xs text-[#8F95B2]">
              Define when this automated response should be triggered for external support tickets.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={ruleForm.handleSubmit(onCreateRuleSubmit)} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider mb-1.5 block">
                Trigger Type
              </label>
              <select
                {...ruleForm.register("type")}
                className="w-full rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-3.5 py-2.5 text-sm font-semibold text-[#1D2A54] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                <option value="GREETING">GREETING — Sent instantly on brand new support tickets</option>
                <option value="KEYWORD">KEYWORD — Sent when incoming message contains keyword</option>
                <option value="AWAY">AWAY — Auto responder when workspace is off-hours</option>
              </select>
            </div>

            {selectedRuleType === "KEYWORD" && (
              <div>
                <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider mb-1.5 block">
                  Keyword Match String <span className="text-red-500">*</span>
                </label>
                <Input
                  {...ruleForm.register("keyword")}
                  placeholder="e.g. refund, pricing, hours"
                  className="rounded-xl border-[#E6EAFA] bg-[#F8FAFC] font-mono text-sm"
                />
                <p className="text-[11px] text-[#8F95B2] mt-1">Matched case-insensitively anywhere in the customer&apos;s text.</p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider mb-1.5 block">
                Automated Response Message <span className="text-red-500">*</span>
              </label>
              <textarea
                {...ruleForm.register("responseMessage")}
                rows={4}
                placeholder="Enter the message that the system will automatically reply with..."
                className="w-full resize-none rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#1D2A54] outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRuleDialogOpen(false)}
                className="rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: CREATE QUICK REPLY */}
      <Dialog open={isQuickReplyDialogOpen} onOpenChange={setIsQuickReplyDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white border border-[#E6EAFA]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1D2A54]">Create Agent Shortcut</DialogTitle>
            <DialogDescription className="text-xs text-[#8F95B2]">
              Shortcuts allow agents to instantly expand full paragraphs by typing a slash command.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={quickReplyForm.handleSubmit(onCreateQuickReplySubmit)} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider mb-1.5 block">
                Slash Command Shortcut <span className="text-red-500">*</span>
              </label>
              <Input
                {...quickReplyForm.register("shortcut")}
                placeholder="/pricing or /refund"
                className="rounded-xl border-[#E6EAFA] bg-[#F8FAFC] font-mono text-sm font-bold text-purple-600"
              />
              <p className="text-[11px] text-[#8F95B2] mt-1">Must start with a leading forward slash (/)</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider mb-1.5 block">
                Full Expansion Content <span className="text-red-500">*</span>
              </label>
              <textarea
                {...quickReplyForm.register("content")}
                rows={4}
                placeholder="Enter the full paragraph that will replace the shortcut when typed..."
                className="w-full resize-none rounded-xl border border-[#E6EAFA] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#1D2A54] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-medium"
              />
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickReplyDialogOpen(false)}
                className="rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Shortcut
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
