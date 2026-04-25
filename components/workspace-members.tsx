"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Plus,
  Mail,
  Shield,
  User as UserIcon,
  Users,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceMember } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchWorkspaceMembers,
  inviteMemberApi,
  updateMemberRoleApi,
  removeMemberApi,
} from "@/lib/api-client";

interface WorkspaceMembersProps {
  workspaceId: string;
  onMembersChange?: (members: WorkspaceMember[]) => void;
}

export function WorkspaceMembers({
  workspaceId,
  onMembersChange,
}: WorkspaceMembersProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ token: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const loadMembers = async () => {
    try {
      const data = await fetchWorkspaceMembers(workspaceId);
      setMembers(data || []);
      onMembersChange?.(data || []);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching members:", err.message);
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const result = await inviteMemberApi(workspaceId, inviteEmail);
      
      if (result.invitation_token) {
        setInviteResult({ token: result.invitation_token, email: inviteEmail });
        setInviteEmail("");
        toast.info(result.message || "Invitation link generated");
      } else {
        setInviteEmail("");
        toast.success("Member invited successfully!");
        await loadMembers();
      }
    } catch (err: any) {
      console.error("Error inviting member:", err.message);
      toast.error(err.message || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = () => {
    if (!inviteResult) return;
    const url = `${window.location.origin}/invite/${inviteResult.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMemberApi(memberId);
      toast.success("Member removed");
      await loadMembers();
    } catch (err: any) {
      console.error("Error removing member:", err.message);
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRoleApi(memberId, newRole);
      toast.success("Role updated");
      await loadMembers();
    } catch (err: any) {
      console.error("Error updating member role:", err.message);
      toast.error("Failed to update member role");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Invite section */}
      <section className="space-y-4 p-4 border rounded-xl bg-muted/20">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Invite to Workspace</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          People with access can see and edit all pages in this workspace.
        </p>
        <form onSubmit={handleInviteMember} className="flex gap-2">
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="bg-background focus-visible:ring-primary/30"
          />
          <Button
            type="submit"
            disabled={!inviteEmail.trim() || inviting}
            className="shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {inviting ? "Inviting..." : "Invite"}
          </Button>
        </form>
      </section>

      <Separator />

      {/* Members list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Current Members</h3>
          </div>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {members.length} {members.length === 1 ? "Member" : "Members"}
          </Badge>
        </div>

        <div className="space-y-3">
          {members.map((member: any) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-xl bg-card/50 hover:bg-card transition-colors group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                  <AvatarImage src={member.user_profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {member.user_profiles?.full_name?.charAt(0) || (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold tracking-tight">
                    {member.user_profiles?.full_name || "Unnamed User"}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {member.user_profiles?.email || "No email provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={member.role}
                  onValueChange={(value) => handleUpdateRole(member.id, value)}
                >
                  <SelectTrigger className="w-[100px] h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <Shield className="w-3 h-3 mr-1 text-primary" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMember(member.id)}
                  className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-12 border border-dashed rounded-xl bg-muted/5">
              <p className="text-sm text-muted-foreground">No members found.</p>
            </div>
          )}
        </div>
      </section>

      <Dialog open={!!inviteResult} onOpenChange={(open) => !open && setInviteResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation Email Sent!</DialogTitle>
            <DialogDescription>
              We've sent an invitation link to <strong>{inviteResult?.email}</strong>. They can join the workspace by clicking the link in the email.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Input
                  readOnly
                  value={inviteResult ? `${window.location.origin}/invite/${inviteResult.token}` : ""}
                  className="font-mono text-xs bg-muted/50"
                />
              </div>
              <Button size="sm" className="px-3" onClick={copyInviteLink}>
                <span className="sr-only">Copy</span>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              * Share this link with the user. They will be added to the workspace after signing up.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button variant="outline" asChild className="w-full">
              <a 
                href={`mailto:${inviteResult?.email}?subject=Invitation to join my Prodeo Hub workspace&body=Hi there!%0D%0A%0D%0AI'd like to invite you to collaborate with me on Prodeo Hub. You can join my workspace by clicking the link below:%0D%0A%0D%0A${window.location.origin}/invite/${inviteResult?.token}%0D%0A%0D%0ASee you there!`}
                className="flex items-center justify-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Default Mail
              </a>
            </Button>
            <Button variant="default" asChild className="w-full bg-[#EA4335] hover:bg-[#EA4335]/90 text-white border-none">
              <a 
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${inviteResult?.email}&su=Invitation to join my Prodeo Hub workspace&body=Hi there!%0D%0A%0D%0AI'd like to invite you to collaborate with me on Prodeo Hub. You can join my workspace by clicking the link below:%0D%0A%0D%0A${window.location.origin}/invite/${inviteResult?.token}%0D%0A%0D%0ASee you there!`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2 filter grayscale brightness-200" alt="Gmail" />
                Open Gmail
              </a>
            </Button>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" size="sm" onClick={() => setInviteResult(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
