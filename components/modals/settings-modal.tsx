"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  Building,
  Settings2,
  Users,
  Bell,
  Shield,
  Mail,
  Globe,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Workspace } from "@/lib/types";
import { WorkspaceMembers } from "@/components/workspace-members";
import { createClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CropImageDialog } from "./crop-image-dialog";

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace?: Workspace;
  workspaceId?: string;
  onWorkspaceUpdate?: (name: string) => void;
}

export function WorkspaceSettingsModal({
  isOpen,
  onClose,
  workspace,
  workspaceId,
  onWorkspaceUpdate,
  }: WorkspaceSettingsModalProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [workspaceName, setWorkspaceName] = React.useState(
    workspace?.name || "",
  );
  const [isUpdatingWorkspace, setIsUpdatingWorkspace] = React.useState(false);
  const supabase = createClient();
  const router = useRouter();



  const handleUpdateWorkspace = async () => {
    if (!workspace || !workspaceName.trim()) return;

    setIsUpdatingWorkspace(true);
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({ name: workspaceName.trim() })
        .eq("id", workspace.id);

      if (error) throw error;

      toast.success("Workspace updated successfully");
      if (onWorkspaceUpdate) {
        onWorkspaceUpdate(workspaceName.trim());
      }
      router.refresh();
    } catch (error) {
      console.error("Error updating workspace:", error);
      toast.error("Failed to update workspace");
    } finally {
      setIsUpdatingWorkspace(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace) return;

    // Warn user before delete
    if (
      !window.confirm(
        "Are you sure you want to delete this workspace? This action cannot be undone and will delete all pages within it.",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", workspace.id);

      if (error) throw error;

      toast.success("Workspace deleted successfully");
      onClose();
      router.push("/workspaces");
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("Failed to delete workspace");
    }
  };

  return (
    <>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-4xl h-[95vh] sm:h-[85vh] flex flex-col sm:flex-row gap-0 p-0 overflow-hidden rounded-xl border-none shadow-2xl bg-zinc-950">
          <DialogHeader className="sr-only">
            <DialogTitle>Workspace Settings</DialogTitle>
          </DialogHeader>
          <Tabs
            defaultValue="workspace"
            className="flex flex-col sm:flex-row w-full h-full"
          >
            {/* Sidebar Area */}
            <div className="w-full sm:w-64 bg-zinc-900/50 border-b sm:border-b-0 sm:border-r border-white/5 py-4 sm:py-6 px-4 flex flex-col gap-4 shrink-0 overflow-x-auto flex-nowrap hide-scrollbar">
              <h3 className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Building className="w-3.5 h-3.5" />
                Workspace Settings
              </h3>
              <TabsList className="justify-start sm:justify-center flex flex-row sm:flex-col items-center sm:items-stretch h-auto bg-transparent p-0 space-x-2 sm:space-x-0 sm:space-y-1 overflow-x-auto flex-nowrap w-max sm:w-full">

                  <div className="flex flex-col space-y-1">
                    <TabsTrigger
                      value="workspace"
                      className="justify-start px-3 py-2 text-sm font-medium data-[state=active]:bg-white/5 data-[state=active]:text-white text-zinc-400 hover:text-white transition-all shrink-0 border-none"
                    >
                      <Building className="w-4 h-4 sm:mr-2 mr-1" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="members"
                      className="justify-start px-3 py-2 text-sm font-medium data-[state=active]:bg-white/5 data-[state=active]:text-white text-zinc-400 hover:text-white transition-all shrink-0 border-none"
                    >
                      <Users className="w-4 h-4 sm:mr-2 mr-1" />
                      Members
                    </TabsTrigger>
                  </div>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto w-full h-full bg-zinc-950 p-6 sm:p-10 relative">
              <div className="max-w-2xl mx-auto space-y-10">


                <TabsContent
                  value="members"
                  className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <header>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Members
                    </h2>
                    <p className="text-zinc-500 text-sm">
                      Manage who has access to this workspace.
                    </p>
                  </header>
                  <WorkspaceMembers
                    workspaceId={workspace?.id || workspaceId!}
                  />
                </TabsContent>



                <TabsContent
                  value="workspace"
                  className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <header>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      Workspace Overview
                    </h2>
                    <p className="text-zinc-500 text-sm">
                      Basic settings for this workspace.
                    </p>
                  </header>
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-4">
                    <div className="pt-2">
                      <Label className="text-sm font-semibold text-white">
                        Workspace Name
                      </Label>
                    </div>
                    <div className="flex gap-3">
                      <Input
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="bg-zinc-900 border-white/10 text-white h-10"
                      />
                      <Button
                        onClick={handleUpdateWorkspace}
                        disabled={
                          !workspace ||
                          workspaceName === workspace.name ||
                          isUpdatingWorkspace ||
                          !workspaceName.trim()
                        }
                        className="bg-white text-black hover:bg-zinc-200"
                      >
                        {isUpdatingWorkspace ? "Saving..." : "Rename"}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-white/5">
                    <h4 className="text-sm font-semibold text-red-500">
                      Danger Zone
                    </h4>
                    <div className="mt-4 p-4 border border-red-500/20 rounded-lg bg-red-500/5 flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-red-500 text-sm">
                          Delete Workspace
                        </h5>
                        <p className="text-xs text-zinc-500 mt-1">
                          This will delete all pages and data.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteWorkspace}
                        disabled={!workspace}
                      >
                        Delete Workspace
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
