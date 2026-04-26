"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth-context";
import {
  fetchWorkspaceById,
  fetchWorkspaceMembers,
  createNotificationApi,
} from "@/lib/api-client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SearchModal } from "@/components/modals/search-modal";
import { WorkspaceSettingsModal } from "@/components/modals/settings-modal";
import { ProfileModal } from "@/components/modals/profile-modal";
import { InboxModal } from "@/components/modals/inbox-modal";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Inbox,
  Send,
  File,
  Trash2,
  Star,
  Search,
  Plus,
  Archive,
  MoreVertical,
  CornerUpLeft,
  Reply,
  Forward,
  Clock,
  ChevronRight,
  Filter,
  Settings,
  Paperclip,
  Download,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EmailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const supabase = createClient();

  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [currentFolder, setCurrentFolder] = useState("inbox");
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [folderCounts, setFolderCounts] = useState({
    inbox: 0,
    starred: 0,
    sent: 0,
    drafts: 0,
    archive: 0,
    trash: 0,
  });
  const currentFolderRef = React.useRef(currentFolder);

  useEffect(() => {
    currentFolderRef.current = currentFolder;
  }, [currentFolder]);

  useEffect(() => {
    if (!user || !workspaceId) return;

    const channel = supabase
      .channel("emails-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emails" },
        (payload) => {
          fetchFolderCounts();
          if (
            payload.eventType === "INSERT" &&
            (payload.new as any).receiver_id === user.id
          ) {
            toast.info("New email received!");
            if (currentFolderRef.current === "inbox") {
              fetchEmails("inbox");
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, workspaceId]);

  // Compose form state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachment, setComposeAttachment] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modal States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredEmails = React.useMemo(() => {
    return emails.filter((email) => {
      const matchesSearch =
        email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.sender?.full_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "unread") return !email.is_read;
      if (activeFilter === "starred") return email.is_starred;
      if (activeFilter === "attachment") return !!email.attachment_url;

      return true;
    });
  }, [emails, searchQuery, activeFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const init = async () => {
      try {
        const ws = await fetchWorkspaceById(workspaceId);
        setWorkspace(ws);
        const mems = await fetchWorkspaceMembers(workspaceId);
        setMembers(mems || []);
        fetchFolderCounts();
        fetchEmails(currentFolder);
        setLoading(false);
      } catch (err) {
        console.error("Error initializing email:", err);
        setLoading(false);
      }
    };

    init();
  }, [user, authLoading, workspaceId]);

  const fetchFolderCounts = async () => {
    try {
      // 1. Unread Inbox Count
      const { count: unreadInbox } = await supabase
        .from("emails")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("receiver_id", user?.id)
        .eq("folder", "inbox")
        .eq("is_read", false);

      setUnreadInboxCount(unreadInbox || 0);

      // 2. Folder Totals
      const fetchCount = async (folder: string) => {
        let q = supabase
          .from("emails")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId);

        if (folder === "inbox") {
          q = q.eq("receiver_id", user?.id).eq("folder", "inbox");
        } else if (folder === "sent") {
          q = q
            .eq("sender_id", user?.id)
            .neq("folder", "trash")
            .neq("folder", "archive");
        } else if (folder === "drafts") {
          q = q.eq("sender_id", user?.id).eq("folder", "drafts");
        } else if (folder === "trash") {
          q = q
            .eq("folder", "trash")
            .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`);
        } else if (folder === "archive") {
          q = q
            .eq("folder", "archive")
            .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`);
        } else if (folder === "starred") {
          q = q
            .eq("is_starred", true)
            .neq("folder", "trash")
            .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`);
        }

        const { count } = await q;
        return count || 0;
      };

      const [inbox, starred, sent, drafts, archive, trash] = await Promise.all([
        fetchCount("inbox"),
        fetchCount("starred"),
        fetchCount("sent"),
        fetchCount("drafts"),
        fetchCount("archive"),
        fetchCount("trash"),
      ]);

      setFolderCounts({ inbox, starred, sent, drafts, archive, trash });
    } catch (err) {
      console.error("Error fetching folder counts:", err);
    }
  };

  const fetchEmails = async (folder: string) => {
    try {
      let query = supabase
        .from("emails")
        .select(
          `
          *,
          sender:user_profiles!sender_id(*),
          receiver:user_profiles!receiver_id(*)
        `,
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (folder === "inbox") {
        query = query.eq("receiver_id", user?.id).eq("folder", "inbox");
      } else if (folder === "sent") {
        query = query
          .eq("sender_id", user?.id)
          .neq("folder", "trash")
          .neq("folder", "archive");
      } else if (folder === "drafts") {
        query = query.eq("sender_id", user?.id).eq("folder", "drafts");
      } else if (folder === "trash") {
        query = query
          .eq("folder", "trash")
          .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`);
      } else if (folder === "archive") {
        query = query
          .eq("folder", "archive")
          .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`);
      } else if (folder === "starred") {
        query = query
          .eq("is_starred", true)
          .neq("folder", "trash")
          .or(`receiver_id.eq.${user?.id},sender_id.eq.${user?.id}`);
      }

      const { data, error } = await query;
      if (error) {
        if (error.code === "42P01") {
          console.warn(
            "Emails table does not exist yet. Please run the migration.",
          );
          return;
        }
        throw error;
      }
      setEmails(data || []);
    } catch (err: any) {
      console.error("Error fetching emails:", err.message || err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${workspaceId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("attachments").getPublicUrl(filePath);

      setComposeAttachment({ url: publicUrl, name: file.name });
      toast.success("File attached", { id: toastId });
    } catch (err: any) {
      console.error("Error uploading file:", err.message || err);
      toast.error("Failed to upload file", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFolderChange = (folder: string) => {
    setCurrentFolder(folder);
    setSelectedEmail(null);
    setSearchQuery("");
    setActiveFilter("all");
    fetchEmails(folder);
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const { error } = await supabase.from("emails").insert({
        workspace_id: workspaceId,
        sender_id: user?.id,
        receiver_id: composeTo,
        subject: composeSubject,
        body: composeBody,
        folder: "inbox",
        attachment_url: composeAttachment?.url || null,
        attachment_name: composeAttachment?.name || null,
      });

      if (error) throw error;

      try {
        await createNotificationApi(
          composeTo,
          `New Email: ${composeSubject}`,
          JSON.stringify({
            type: "email",
            senderName: user?.user_metadata?.full_name || user?.email,
            senderEmail: user?.email,
            subject: composeSubject,
            preview: composeBody.substring(0, 100),
          }),
          `/workspace/${workspaceId}/email`,
        );
      } catch (err) {
        console.error("Failed to create notification", err);
      }

      toast.success("Email sent");
      setIsComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeAttachment(null);
      if (currentFolder === "sent") fetchEmails("sent");
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error("Failed to send email");
    }
  };

  const toggleStar = async (email: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from("emails")
        .update({ is_starred: !email.is_starred })
        .eq("id", email.id);

      if (error) throw error;

      const updatedEmail = { ...email, is_starred: !email.is_starred };
      setEmails(emails.map((e) => (e.id === email.id ? updatedEmail : e)));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(updatedEmail);
      }
      toast.success(
        updatedEmail.is_starred ? "Email starred" : "Email unstarred",
      );
    } catch (err) {
      console.error("Error toggling star:", err);
      toast.error("Failed to update star status");
    }
  };

  const markAsRead = async (email: any) => {
    if (email.is_read) return;
    try {
      await supabase
        .from("emails")
        .update({ is_read: true })
        .eq("id", email.id);

      const updatedEmail = { ...email, is_read: true };
      setEmails(emails.map((e) => (e.id === email.id ? updatedEmail : e)));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(updatedEmail);
      }
      if (email.folder === "inbox") {
        setUnreadInboxCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const handleArchiveEmail = async (email: any) => {
    try {
      const { error } = await supabase
        .from("emails")
        .update({ folder: "archive" })
        .eq("id", email.id);

      if (error) throw error;

      toast.success('Email archived');
      setEmails(emails.filter((e) => e.id !== email.id));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
      }
      fetchFolderCounts();
    } catch (err) {
      console.error("Error archiving email:", err);
      toast.error("Failed to archive email");
    }
  };

  const handleDeleteEmail = async (email: any) => {
    try {
      if (email.folder === 'trash') {
        const { error } = await supabase
          .from('emails')
          .delete()
          .eq('id', email.id);
        if (error) throw error;
        toast.success('Email deleted permanently');
      } else {
        const { error } = await supabase
          .from('emails')
          .update({ folder: 'trash' })
          .eq('id', email.id);
        if (error) throw error;
        toast.success('Email moved to trash');
      }

      setEmails(emails.filter((e) => e.id !== email.id));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
      }
      fetchFolderCounts();
    } catch (err) {
      console.error('Error deleting email:', err);
      toast.error('Failed to delete email');
    }
  };

  const handleRestoreEmail = async (email: any) => {
    try {
      const { error } = await supabase
        .from('emails')
        .update({ folder: 'inbox' })
        .eq('id', email.id);

      if (error) throw error;

      toast.success('Email restored to inbox');
      setEmails(emails.filter((e) => e.id !== email.id));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
      }
      fetchFolderCounts();
    } catch (err) {
      console.error('Error restoring email:', err);
      toast.error('Failed to restore email');
    }
  };

  const handleReplyEmail = (email: any) => {
    setComposeTo(email.sender_id);
    setComposeSubject(`Re: ${email.subject}`);
    setComposeBody(
      `\n\n--- On ${format(new Date(email.created_at), "MMM d, yyyy HH:mm")}, ${email.sender?.full_name} wrote: ---\n\n${email.body}`,
    );
    setIsComposeOpen(true);
  };

  const handleForwardEmail = (email: any) => {
    setComposeTo("");
    setComposeSubject(`Fwd: ${email.subject}`);
    setComposeBody(
      `\n\n--- Forwarded message ---\nFrom: ${email.sender?.full_name} <${email.sender?.email}>\nDate: ${format(new Date(email.created_at), "MMM d, yyyy HH:mm")}\nSubject: ${email.subject}\nTo: me\n\n${email.body}`,
    );
    setIsComposeOpen(true);
  };

  const handleEmptyTrash = async () => {
    if (!user?.id || !workspaceId) return;

    try {
      // Fetch IDs of emails in trash first to be safe and robust
      const { data: trashEmails, error: fetchError } = await supabase
        .from("emails")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("folder", "trash")
        .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`);

      if (fetchError) throw fetchError;
      if (!trashEmails || trashEmails.length === 0) {
        toast.info("Trash is already empty");
        return;
      }

      const ids = trashEmails.map((e) => e.id);

      const { error } = await supabase.from("emails").delete().in("id", ids);

      if (error) throw error;

      toast.success("Trash emptied");
      setEmails([]);
      if (selectedEmail?.folder === "trash") {
        setSelectedEmail(null);
      }
      fetchFolderCounts();
    } catch (err) {
      console.error("Error emptying trash:", err);
      toast.error("Failed to empty trash");
    }
  };

  if (loading) return null;

  return (
    <SidebarProvider>
      <AppSidebar
        workspace={workspace}
        pages={[]}
        selectedPageId={null}
        onSelectPage={() => {}}
        onCreatePage={() => {}}
        onDeletePage={() => {}}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenInbox={() => setIsInboxOpen(true)}
      />

      <SidebarInset className="flex flex-col h-screen overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur z-10">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full w-full max-w-md group focus-within:bg-background focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
              <input
                placeholder="Search email..."
                className="bg-transparent border-none focus:ring-0 text-sm flex-1 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${activeFilter !== "all" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <Filter className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl shadow-xl"
                >
                  <DropdownMenuRadioGroup
                    value={activeFilter}
                    onValueChange={setActiveFilter}
                  >
                    <DropdownMenuRadioItem
                      value="all"
                      className="rounded-lg cursor-pointer"
                    >
                      All Emails
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="unread"
                      className="rounded-lg cursor-pointer"
                    >
                      Unread
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="starred"
                      className="rounded-lg cursor-pointer"
                    >
                      Starred
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="attachment"
                      className="rounded-lg cursor-pointer"
                    >
                      Has Attachment
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setIsSnoozeModalOpen(true)}
            >
              <Clock className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Email Sidebar */}
          <div className="w-64 border-r bg-muted/10 hidden lg:flex flex-col">
            <div className="p-4">
              <Button
                className="w-full justify-start gap-2 h-12 rounded-2xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
                onClick={() => setIsComposeOpen(true)}
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Compose</span>
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-3 py-2 space-y-1">
                <Button
                  variant={currentFolder === "inbox" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl ${currentFolder === "inbox" ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("inbox")}
                >
                  <Inbox className="w-4 h-4" />
                  <span className="flex-1 text-left font-medium">Inbox</span>
                  {unreadInboxCount > 0 && (
                    <span className="text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">
                      {unreadInboxCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "starred" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl ${currentFolder === "starred" ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("starred")}
                >
                  <Star className="w-4 h-4" />
                  <span className="flex-1 text-left font-medium">Starred</span>
                  {folderCounts.starred > 0 && (
                    <span className="text-[10px] font-bold bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                      {folderCounts.starred}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "sent" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl ${currentFolder === "sent" ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("sent")}
                >
                  <Send className="w-4 h-4" />
                  <span className="flex-1 text-left font-medium">Sent</span>
                  {folderCounts.sent > 0 && (
                    <span className="text-[10px] font-bold bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                      {folderCounts.sent}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "drafts" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl ${currentFolder === "drafts" ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("drafts")}
                >
                  <File className="w-4 h-4" />
                  <span className="flex-1 text-left font-medium">Drafts</span>
                  {folderCounts.drafts > 0 && (
                    <span className="text-[10px] font-bold bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                      {folderCounts.drafts}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "archive" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl ${currentFolder === "archive" ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("archive")}
                >
                  <Archive className="w-4 h-4" />
                  <span className="flex-1 text-left font-medium">Archive</span>
                  {folderCounts.archive > 0 && (
                    <span className="text-[10px] font-bold bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                      {folderCounts.archive}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "trash" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl ${currentFolder === "trash" ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("trash")}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="flex-1 text-left font-medium">Trash</span>
                  {folderCounts.trash > 0 && (
                    <span className="text-[10px] font-bold bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                      {folderCounts.trash}
                    </span>
                  )}
                </Button>
              </div>

              <div className="mt-8 px-5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Labels
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium hover:bg-muted rounded-lg cursor-pointer transition-colors group">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Work</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                  </div>
                  <div className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium hover:bg-muted rounded-lg cursor-pointer transition-colors group">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>Personal</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Email List */}
          <div
            className={`${selectedEmail ? "hidden xl:flex" : "flex"} w-full lg:w-[400px] border-r flex flex-col bg-muted/5`}
          >
            <div className="p-4 border-b flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-muted-foreground/30"
                />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {currentFolder === "trash" ? "Trash" : "All Messages"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {currentFolder === "trash" && emails.length > 0 && (
                  <ConfirmModal
                    onConfirm={handleEmptyTrash}
                    title="Empty Trash?"
                    description="Are you sure you want to permanently delete all messages in Trash? This action cannot be undone."
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-bold text-white hover:bg-white/10 rounded-xl px-4 border-2 border-white flex items-center gap-2 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Empty Trash
                    </Button>
                  </ConfirmModal>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-muted/50">
                {filteredEmails.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No emails found
                      {searchQuery || activeFilter !== "all"
                        ? " matching your filters"
                        : " in this folder"}
                      .
                    </p>
                  </div>
                )}
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    className={`p-4 cursor-pointer transition-all hover:bg-muted/50 group relative ${selectedEmail?.id === email.id ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : ""} ${!email.is_read ? "bg-background border-l-4 border-l-primary" : ""}`}
                    onClick={() => {
                      setSelectedEmail(email);
                      markAsRead(email);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
                        <AvatarImage src={email.sender?.avatar_url} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                          {email.sender?.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm truncate ${!email.is_read ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}
                          >
                            {email.sender?.full_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {format(new Date(email.created_at), "MMM d")}
                          </span>
                        </div>
                        <h4
                          className={`text-xs truncate mb-1 ${!email.is_read ? "font-bold text-foreground" : "font-semibold text-muted-foreground/80"}`}
                        >
                          {email.subject}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                          {email.body}
                        </p>
                      </div>
                    </div>
                    <div className="absolute right-4 bottom-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 rounded-full ${email.is_starred ? "text-yellow-500" : "text-muted-foreground"}`}
                        onClick={(e) => toggleStar(email, e)}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveEmail(email);
                        }}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                      {email.folder === "trash" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreEmail(email);
                          }}
                          title="Restore to Inbox"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      {email.folder === 'trash' ? (
                        <ConfirmModal
                          onConfirm={() => handleDeleteEmail(email)}
                          title="Delete Permanently?"
                          description="Are you sure you want to permanently delete this email?"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </ConfirmModal>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEmail(email);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Email Preview */}
          <div
            className={`flex-1 flex flex-col bg-background relative ${!selectedEmail ? "hidden lg:flex items-center justify-center" : "flex"}`}
          >
            {selectedEmail ? (
              <>
                <header className="h-16 border-b flex items-center justify-between px-6 sticky top-0 bg-background/95 backdrop-blur z-10">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full lg:hidden mr-2"
                      onClick={() => setSelectedEmail(null)}
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      onClick={() => handleArchiveEmail(selectedEmail)}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    {selectedEmail.folder === 'trash' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                          onClick={() => handleRestoreEmail(selectedEmail)}
                          title="Restore to Inbox"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <ConfirmModal
                          onConfirm={() => handleDeleteEmail(selectedEmail)}
                          title="Delete Permanently?"
                          description="This email will be permanently removed from your account. This action cannot be undone."
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </ConfirmModal>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDeleteEmail(selectedEmail)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Separator orientation="vertical" className="h-4 mx-2" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-muted-foreground"
                      onClick={() => handleReplyEmail(selectedEmail)}
                    >
                      <Reply className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-muted-foreground"
                      onClick={() => handleForwardEmail(selectedEmail)}
                    >
                      <Forward className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => toggleStar(selectedEmail)}
                    >
                      <Star
                        className={`w-4 h-4 ${selectedEmail.is_starred ? "fill-yellow-500 text-yellow-500" : ""}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </header>
                <ScrollArea className="flex-1">
                  <div className="max-w-4xl mx-auto p-8 md:p-12">
                    <div className="flex items-start justify-between mb-10">
                      <div className="space-y-4 flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight">
                          {selectedEmail.subject}
                        </h1>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 ring-4 ring-muted shadow-lg">
                            <AvatarImage
                              src={selectedEmail.sender?.avatar_url}
                            />
                            <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                              {selectedEmail.sender?.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">
                                {selectedEmail.sender?.full_name}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                &lt;{selectedEmail.sender?.email}&gt;
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              to me,{" "}
                              {format(
                                new Date(selectedEmail.created_at),
                                "MMMM d, yyyy • HH:mm",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap text-base">
                      {selectedEmail.body}
                    </div>

                    {selectedEmail.attachment_url && (
                      <div className="mt-10 p-6 rounded-2xl border-2 border-dashed border-muted bg-muted/5">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                          Attachments (1)
                        </h4>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-background border shadow-sm group hover:shadow-md transition-all w-fit min-w-[280px]">
                          <div className="p-3 rounded-lg bg-primary/5 text-primary">
                            <Paperclip className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold truncate">
                              {selectedEmail.attachment_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Click to download attachment
                            </span>
                          </div>
                          <a
                            href={selectedEmail.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    <Separator className="my-12 opacity-50" />

                    <div className="flex flex-wrap gap-4">
                      <Button
                        variant="outline"
                        className="rounded-full px-6 h-11 border-2 hover:bg-primary/5 hover:border-primary/50 transition-all font-semibold"
                        onClick={() => handleReplyEmail(selectedEmail)}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full px-6 h-11 border-2 hover:bg-primary/5 hover:border-primary/50 transition-all font-semibold"
                        onClick={() => handleForwardEmail(selectedEmail)}
                      >
                        <Forward className="w-4 h-4 mr-2" />
                        Forward
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                  <Inbox className="w-24 h-24 text-muted-foreground/20 relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Select an email to read
                </h3>
                <p className="mt-3 text-muted-foreground max-w-sm leading-relaxed">
                  Choose a message from the list on the left to see its full
                  content here.
                </p>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>

      {/* Compose Modal */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              New Message
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Recipient
              </label>
              <Select onValueChange={setComposeTo} value={composeTo}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none focus:ring-1 focus:ring-primary/20">
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {members
                    .filter((m) => m.user_id !== user?.id)
                    .map((member) => (
                      <SelectItem
                        key={member.id}
                        value={member.user_id}
                        className="rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={member.user_profiles?.avatar_url}
                            />
                            <AvatarFallback>
                              {member.user_profiles?.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.user_profiles?.full_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Subject
              </label>
              <Input
                placeholder="What is this about?"
                className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                Message Content
              </label>
              <textarea
                rows={8}
                placeholder="Write your message here..."
                className="w-full bg-muted/20 rounded-2xl border-none p-4 text-sm focus:ring-1 focus:ring-primary/20 outline-none resize-none"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
            </div>

            {composeAttachment && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-bold truncate">
                    {composeAttachment.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setComposeAttachment(null)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button
                variant="ghost"
                className="rounded-xl font-semibold gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip
                  className={`w-4 h-4 ${isUploading ? "animate-pulse" : ""}`}
                />
                {isUploading ? "Uploading..." : "Attach File"}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="rounded-xl font-semibold"
                onClick={() => setIsComposeOpen(false)}
              >
                Discard
              </Button>
              <Button
                className="rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                onClick={handleSendEmail}
                disabled={isUploading}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pages={[]}
        onSelect={() => {}}
      />
      <WorkspaceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        workspace={workspace}
        workspaceId={workspaceId}
        onWorkspaceUpdate={() => {}}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <InboxModal isOpen={isInboxOpen} onClose={() => setIsInboxOpen(false)} />
      <Dialog open={isSnoozeModalOpen} onOpenChange={setIsSnoozeModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader className="px-6 py-4 bg-muted/30 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Snoozed & Reminders
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center space-y-4">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
              <Clock className="w-16 h-16 text-primary relative z-10 mx-auto" />
            </div>
            <h3 className="text-xl font-bold">Coming Soon</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The snooze and email reminder functionality is currently in
              development. You will soon be able to schedule emails to reappear
              in your inbox!
            </p>
          </div>
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t">
            <Button
              className="w-full rounded-xl font-bold"
              onClick={() => setIsSnoozeModalOpen(false)}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
