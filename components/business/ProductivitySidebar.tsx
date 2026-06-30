"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Plus,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Film,
  FileIcon,
  Loader2,
  Trash2,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  User,
  Calendar as CalendarIcon,
  ExternalLink,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSocket } from "@/components/providers/SocketProvider";
import {
  CollaborationService,
  WorkspaceTask,
  WorkspaceFileRecord,
  TaskStatus,
} from "@/services/collaboration.service";
import apiClient from "@/services/api.client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface WorkspaceMember {
  userId: string;
  role: string;
  user?: {
    id: string;
    profile?: { displayName?: string; username?: string; avatarUrl?: string | null };
  };
}

interface ProductivitySidebarProps {
  workspaceId: string;
  channelId?: string;
  ticketId?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badgeBg: string }
> = {
  TODO: {
    label: "To Do",
    icon: ListTodo,
    color: "text-amber-600",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Clock,
    color: "text-blue-600",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
  },
  DONE: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-emerald-600",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

export function ProductivitySidebar({
  workspaceId,
  channelId,
  ticketId,
  className,
}: ProductivitySidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "files">("tasks");

  // State
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);
  const [files, setFiles] = useState<WorkspaceFileRecord[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // New Task Dialog State
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");
  const [newTaskDate, setNewTaskDate] = useState<string>("");
  const [creatingTask, setCreatingTask] = useState(false);

  // Fetch Members for assignment
  useEffect(() => {
    if (!workspaceId) return;
    apiClient
      .get("/business/workspaces/me")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data?.members)) {
          setMembers(res.data.data.members);
        }
      })
      .catch(() => setMembers([]));
  }, [workspaceId]);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingTasks(true);
    try {
      const res = await CollaborationService.getTasks({ workspaceId, channelId, ticketId });
      if (res.success) setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch workspace tasks", err);
    } finally {
      setLoadingTasks(false);
    }
  }, [workspaceId, channelId, ticketId]);

  // Fetch Files
  const fetchFiles = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingFiles(true);
    try {
      const res = await CollaborationService.getFiles(channelId, workspaceId, ticketId);
      if (res.success) setFiles(res.data);
    } catch (err) {
      console.error("Failed to fetch workspace files", err);
    } finally {
      setLoadingFiles(false);
    }
  }, [workspaceId, channelId, ticketId]);

  useEffect(() => {
    if (activeTab === "tasks") fetchTasks();
    if (activeTab === "files") fetchFiles();
  }, [activeTab, fetchTasks, fetchFiles]);

  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !workspaceId) return;

    const handleTaskUpdated = (data: { workspaceId: string }) => {
      if (data.workspaceId === workspaceId) {
        fetchTasks();
      }
    };

    socket.on("workspace:task_updated", handleTaskUpdated);

    return () => {
      socket.off("workspace:task_updated", handleTaskUpdated);
    };
  }, [socket, workspaceId, fetchTasks]);

  // Handle Create Task
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    setCreatingTask(true);
    try {
      const res = await CollaborationService.createTask({
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || undefined,
        assignedUserId: newTaskAssignee || null,
        dueDate: newTaskDate ? new Date(newTaskDate).toISOString() : null,
        workspaceId,
        channelId: channelId || null,
        ticketId: ticketId || null,
      });
      if (res.success) {
        toast.success("Task created successfully");
        setTasks((prev) => [res.data, ...prev]);
        setNewTaskOpen(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskAssignee("");
        setNewTaskDate("");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId) return;
    setUploadingFile(true);
    try {
      const res = await CollaborationService.uploadFile(file, channelId || null, ticketId || null, workspaceId);
      if (res.success) {
        toast.success("File uploaded to Cloudinary registry");
        setFiles((prev) => [res.data, ...prev]);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
      if (e.target) e.target.value = "";
    }
  };

  // Optimistic Status Change
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await CollaborationService.updateTask(taskId, {
        status: newStatus,
        workspaceId,
      });
      if (!res.success) throw new Error("Update failed");
      toast.success(`Task moved to ${STATUS_CONFIG[newStatus].label}`);
    } catch (err) {
      toast.error("Failed to update task status");
      setTasks(previousTasks);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string) => {
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      const res = await CollaborationService.deleteTask(taskId, workspaceId);
      if (res.success) {
        toast.success("Task deleted");
      }
    } catch (err) {
      toast.error("Failed to delete task");
      setTasks(previousTasks);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf") || type.includes("text") || type.includes("doc")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (type.includes("image")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (type.includes("video")) {
      return <Film className="h-5 w-5 text-purple-500" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (isCollapsed) {
    return (
      <aside className="flex h-full w-14 shrink-0 flex-col items-center justify-between border-l border-[#E6EAFA] bg-white py-4 shadow-sm transition-all duration-300">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expand Sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <PanelRightOpen className="h-5 w-5" />
          </button>
          <div className="h-px w-6 bg-gray-200" />
          <button
            onClick={() => { setActiveTab("tasks"); setIsCollapsed(false); }}
            title="Tasks"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              activeTab === "tasks" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <ListTodo className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setActiveTab("files"); setIsCollapsed(false); }}
            title="Media Gallery"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              activeTab === "files" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <FolderOpen className="h-5 w-5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-full w-[300px] shrink-0 flex-col border-l border-[#E6EAFA] bg-white shadow-sm transition-all duration-300 md:w-[320px] lg:w-[340px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E6EAFA] px-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#11142D]">
          Workspace Productivity
        </h2>
        <button
          onClick={() => setIsCollapsed(true)}
          title="Collapse Sidebar"
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "tasks" | "files")}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="grid w-full grid-cols-2 rounded-lg bg-[#F4F6FC] p-1">
            <TabsTrigger
              value="tasks"
              className="flex items-center justify-center gap-1.5 rounded-md text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
            >
              <ListTodo className="h-3.5 w-3.5" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center justify-center gap-1.5 rounded-md text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Files ({files.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TASKS TAB */}
        <TabsContent value="tasks" className="mt-0 flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Board Items
            </span>
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 bg-purple-600 hover:bg-purple-700 text-white gap-1 text-xs px-2.5 font-bold shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-base font-extrabold text-[#11142D]">Create Workspace Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Title *</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Follow up on proposal SLA"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">Description (Optional)</label>
                    <textarea
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Add details, notes, or checklist items..."
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Assignee</label>
                      <select
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium outline-none focus:border-purple-500"
                      >
                        <option value="">Unassigned</option>
                        {members.map((m) => {
                          const name = m.user?.profile?.displayName || m.user?.profile?.username || "Member";
                          return (
                            <option key={m.userId} value={m.userId}>
                              {name} ({m.role})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">Due Date</label>
                      <input
                        type="date"
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setNewTaskOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={creatingTask || !newTaskTitle.trim()}
                    onClick={handleCreateTask}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    {creatingTask ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create Task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingTasks ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <span className="text-xs font-medium">Loading tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <ListTodo className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-700">No tasks on the board</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Create actionable items for your team</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(["TODO", "IN_PROGRESS", "DONE"] as TaskStatus[]).map((statusGroup) => {
                const groupTasks = tasks.filter((t) => t.status === statusGroup);
                const config = STATUS_CONFIG[statusGroup];
                const IconComponent = config.icon;

                return (
                  <div key={statusGroup} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className={cn("h-3.5 w-3.5", config.color)} />
                        <span className="text-xs font-extrabold text-gray-800">{config.label}</span>
                      </div>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", config.badgeBg)}>
                        {groupTasks.length}
                      </span>
                    </div>

                    {groupTasks.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic py-1 pl-5">Empty</p>
                    ) : (
                      <div className="space-y-2">
                        {groupTasks.map((task) => {
                          const assigneeName =
                            task.assignedUser?.profile?.displayName || task.assignedUser?.email || "Unassigned";

                          return (
                            <Popover key={task.id}>
                              <PopoverTrigger asChild>
                                <div className="group relative flex cursor-pointer flex-col gap-1.5 rounded-lg border border-gray-200 bg-white p-3 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={cn("text-xs font-bold text-gray-800 line-clamp-2", task.status === "DONE" && "line-through text-gray-400")}>
                                      {task.title}
                                    </p>
                                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-purple-600 transition-colors shrink-0 mt-0.5" />
                                  </div>
                                  {task.description && (
                                    <p className="text-[11px] text-gray-500 line-clamp-2">{task.description}</p>
                                  )}
                                  <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500">
                                    <div className="flex items-center gap-1 truncate max-w-[130px]">
                                      <User className="h-3 w-3 text-gray-400 shrink-0" />
                                      <span className="truncate">{assigneeName}</span>
                                    </div>
                                    {task.dueDate && (
                                      <div className="flex items-center gap-1 font-semibold text-gray-600">
                                        <CalendarIcon className="h-3 w-3 text-purple-500" />
                                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-48 p-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                                  Move Status
                                </p>
                                <div className="space-y-1">
                                  {(["TODO", "IN_PROGRESS", "DONE"] as TaskStatus[]).map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => handleStatusChange(task.id, s)}
                                      className={cn(
                                        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-purple-50",
                                        task.status === s ? "text-purple-700 font-bold bg-purple-50/50" : "text-gray-700"
                                      )}
                                    >
                                      <span>{STATUS_CONFIG[s].label}</span>
                                      {task.status === s && <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />}
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-2 border-t border-gray-100 pt-1">
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Task
                                  </button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* FILES TAB */}
        <TabsContent value="files" className="mt-0 flex flex-1 flex-col overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Shared Media & Docs
            </span>
            <div className="flex items-center gap-2.5">
              <label className="cursor-pointer flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors shadow-2xs">
                {uploadingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                <span>{uploadingFile ? "Uploading..." : "Upload"}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
              </label>
              <button
                onClick={fetchFiles}
                className="text-xs font-bold text-gray-500 hover:text-purple-600 hover:underline"
              >
                Refresh
              </button>
            </div>
          </div>

          {loadingFiles ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <span className="text-xs font-medium">Loading gallery...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <FolderOpen className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-700">No files registered</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Media uploaded in chat will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {files.map((file) => {
                const uploaderName =
                  file.uploader?.profile?.displayName || file.uploader?.email || "Team Member";
                return (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2.5 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F4F6FC] group-hover:bg-purple-50 transition-colors">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 truncate group-hover:text-purple-600 transition-colors">
                        {file.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                        <span>{formatFileSize(file.sizeBytes)}</span>
                        <span>•</span>
                        <span className="truncate">{uploaderName}</span>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-purple-600 shrink-0 transition-colors" />
                  </a>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
}
