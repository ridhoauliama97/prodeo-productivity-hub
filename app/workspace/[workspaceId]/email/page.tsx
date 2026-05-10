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
  Mail,
  MailOpen,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const currentFolderRef = React.useRef(currentFolder);

  useEffect(() => {
    currentFolderRef.current = currentFolder;
  }, [currentFolder]);

  // Helper: fetch a single email with joined sender/receiver profiles
  const fetchEmailById = async (emailId: string) => {
    const { data, error } = await supabase
      .from("emails")
      .select(`
        *,
        sender:user_profiles!sender_id(*),
        receiver:user_profiles!receiver_id(*)
      `)
      .eq("id", emailId)
      .single();

    if (error) {
      console.error("Error fetching email by id:", error);
      return null;
    }
    return data;
  };

  // Helper: check if an email belongs in the current folder view
  const emailBelongsInCurrentView = (email: any, folder: string): boolean => {
    if (folder === "inbox") {
      return email.receiver_id === user?.id && email.folder === "inbox";
    } else if (folder === "sent") {
      return email.sender_id === user?.id && email.folder !== "trash" && email.folder !== "archive";
    } else if (folder === "drafts") {
      return email.sender_id === user?.id && email.folder === "drafts";
    } else if (folder === "trash") {
      return email.folder === "trash" && (email.receiver_id === user?.id || email.sender_id === user?.id);
    } else if (folder === "archive") {
      return email.folder === "archive" && (email.receiver_id === user?.id || email.sender_id === user?.id);
    } else if (folder === "starred") {
      return email.is_starred && email.folder !== "trash" && (email.receiver_id === user?.id || email.sender_id === user?.id);
    }
    return false;
  };

  useEffect(() => {
    if (!user || !workspaceId) return;

    const channel = supabase
      .channel(`email-realtime-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emails",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
          const raw = payload.new as any;
          fetchFolderCounts();

          // Only show toast & update list for emails relevant to this user
          if (raw.receiver_id === user.id) {
            toast.info(`New email: ${raw.subject || "(No subject)"}`);
          }

          const folder = currentFolderRef.current;
          if (emailBelongsInCurrentView(raw, folder)) {
            // Fetch full email with joined profiles so avatar/name render correctly
            const fullEmail = await fetchEmailById(raw.id);
            if (fullEmail) {
              setEmails(prev => {
                // Guard against duplicates (in case local insert already added it)
                if (prev.some(e => e.id === fullEmail.id)) return prev;
                return [fullEmail, ...prev];
              });
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "emails",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          const folder = currentFolderRef.current;
          fetchFolderCounts();

          // Single atomic state update: merge changes AND filter out if it no longer belongs
          setEmails(prev =>
            prev.reduce<any[]>((acc, e) => {
              if (e.id !== updated.id) {
                acc.push(e);
              } else {
                const merged = { ...e, ...updated };
                if (emailBelongsInCurrentView(merged, folder)) {
                  acc.push(merged);
                }
                // else: email no longer belongs in this view, drop it
              }
              return acc;
            }, [])
          );

          // Update selected email if it's the one that changed
          setSelectedEmail((prev: any) => {
            if (prev?.id === updated.id) {
              return { ...prev, ...updated };
            }
            return prev;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "emails",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const deleted = payload.old as any;
          fetchFolderCounts();

          setEmails(prev => prev.filter(e => e.id !== deleted.id));
          setSelectedEmail((prev: any) => (prev?.id === deleted.id ? null : prev));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, workspaceId]);

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
    setSelectedEmailIds(new Set());
    setSearchQuery("");
    setActiveFilter("all");
    fetchEmails(folder);
  };

  const toggleEmailSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSelected = new Set(selectedEmailIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmailIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEmailIds.size === filteredEmails.length && filteredEmails.length > 0) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(filteredEmails.map((e) => e.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedEmailIds.size === 0) return;

    const idsToDelete = Array.from(selectedEmailIds);
    const toastId = toast.loading(`${currentFolder === 'trash' ? 'Deleting' : 'Moving to trash'} ${selectedEmailIds.size} emails...`);

    try {
      let error;
      if (currentFolder === 'trash') {
        const { error: deleteError } = await supabase
          .from('emails')
          .delete()
          .in('id', idsToDelete);
        error = deleteError;
      } else {
        const { error: updateError } = await supabase
          .from('emails')
          .update({ folder: 'trash' })
          .in('id', idsToDelete);
        error = updateError;
      }

      if (error) throw error;

      toast.success(`${idsToDelete.length} emails ${currentFolder === 'trash' ? 'deleted permanently' : 'moved to trash'}`, { id: toastId });
      setEmails(emails.filter((e) => !selectedEmailIds.has(e.id)));
      if (selectedEmail?.id && selectedEmailIds.has(selectedEmail.id)) {
        setSelectedEmail(null);
      }
      setSelectedEmailIds(new Set());
      fetchFolderCounts();
    } catch (err) {
      console.error("Error batch deleting emails:", err);
      toast.error("Failed to delete emails", { id: toastId });
    }
  };

  const handleBatchArchive = async () => {
    if (selectedEmailIds.size === 0) return;

    const idsToArchive = Array.from(selectedEmailIds);
    const toastId = toast.loading(`Archiving ${selectedEmailIds.size} emails...`);

    try {
      const { error } = await supabase
        .from('emails')
        .update({ folder: 'archive' })
        .in('id', idsToArchive);

      if (error) throw error;

      toast.success(`${idsToArchive.length} emails archived`, { id: toastId });
      setEmails(emails.filter((e) => !selectedEmailIds.has(e.id)));
      if (selectedEmail?.id && selectedEmailIds.has(selectedEmail.id)) {
        setSelectedEmail(null);
      }
      setSelectedEmailIds(new Set());
      fetchFolderCounts();
    } catch (err) {
      console.error("Error batch archiving emails:", err);
      toast.error("Failed to archive emails", { id: toastId });
    }
  };

  const handleBatchMarkAsRead = async (isRead: boolean) => {
    if (selectedEmailIds.size === 0) return;

    const ids = Array.from(selectedEmailIds);
    const toastId = toast.loading(`Marking ${selectedEmailIds.size} emails as ${isRead ? 'read' : 'unread'}...`);

    try {
      const { error } = await supabase
        .from('emails')
        .update({ is_read: isRead })
        .in('id', ids);

      if (error) throw error;

      toast.success(`${ids.length} emails marked as ${isRead ? 'read' : 'unread'}`, { id: toastId });
      
      // Update local state
      setEmails(emails.map(email => 
        selectedEmailIds.has(email.id) ? { ...email, is_read: isRead } : email
      ));
      
      if (selectedEmail && selectedEmailIds.has(selectedEmail.id)) {
        setSelectedEmail({ ...selectedEmail, is_read: isRead });
      }
      
      setSelectedEmailIds(new Set());
      fetchFolderCounts();
    } catch (err) {
      console.error("Error batch marking read/unread:", err);
      toast.error("Failed to update emails", { id: toastId });
    }
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
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="w-full justify-start gap-2 h-12 rounded-2xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all bg-gradient-to-r from-primary to-primary/80 border-none text-white"
                  onClick={() => setIsComposeOpen(true)}
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Compose</span>
                </Button>
              </motion.div>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-3 py-2 space-y-1">
                <Button
                  variant={currentFolder === "inbox" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl relative overflow-hidden group ${currentFolder === "inbox" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("inbox")}
                >
                  {currentFolder === "inbox" && (
                    <motion.div
                      layoutId="folder-active"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Inbox className={`w-4 h-4 transition-transform group-hover:scale-110 ${currentFolder === "inbox" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-left font-medium">Inbox</span>
                  {unreadInboxCount > 0 && (
                    <span className="text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded-full ring-1 ring-primary/20">
                      {unreadInboxCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "starred" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl relative overflow-hidden group ${currentFolder === "starred" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("starred")}
                >
                  {currentFolder === "starred" && (
                    <motion.div
                      layoutId="folder-active"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Star className={`w-4 h-4 transition-transform group-hover:scale-110 ${currentFolder === "starred" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-left font-medium">Starred</span>
                  {folderCounts.starred > 0 && (
                    <span className="text-[10px] font-bold bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                      {folderCounts.starred}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "sent" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl relative overflow-hidden group ${currentFolder === "sent" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("sent")}
                >
                  {currentFolder === "sent" && (
                    <motion.div
                      layoutId="folder-active"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Send className={`w-4 h-4 transition-transform group-hover:scale-110 ${currentFolder === "sent" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-left font-medium">Sent</span>
                  {folderCounts.sent > 0 && (
                    <span className="text-[10px] font-bold bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                      {folderCounts.sent}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "drafts" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl relative overflow-hidden group ${currentFolder === "drafts" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("drafts")}
                >
                  {currentFolder === "drafts" && (
                    <motion.div
                      layoutId="folder-active"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <File className={`w-4 h-4 transition-transform group-hover:scale-110 ${currentFolder === "drafts" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-left font-medium">Drafts</span>
                  {folderCounts.drafts > 0 && (
                    <span className="text-[10px] font-bold bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                      {folderCounts.drafts}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "archive" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl relative overflow-hidden group ${currentFolder === "archive" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("archive")}
                >
                  {currentFolder === "archive" && (
                    <motion.div
                      layoutId="folder-active"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Archive className={`w-4 h-4 transition-transform group-hover:scale-110 ${currentFolder === "archive" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="flex-1 text-left font-medium">Archive</span>
                  {folderCounts.archive > 0 && (
                    <span className="text-[10px] font-bold bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                      {folderCounts.archive}
                    </span>
                  )}
                </Button>
                <Button
                  variant={currentFolder === "trash" ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-10 rounded-xl relative overflow-hidden group ${currentFolder === "trash" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  onClick={() => handleFolderChange("trash")}
                >
                  {currentFolder === "trash" && (
                    <motion.div
                      layoutId="folder-active"
                      className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Trash2 className={`w-4 h-4 transition-transform group-hover:scale-110 ${currentFolder === "trash" ? "text-primary" : "text-muted-foreground"}`} />
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
            <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-muted-foreground/30 cursor-pointer accent-primary"
                  checked={selectedEmailIds.size === filteredEmails.length && filteredEmails.length > 0}
                  onChange={handleSelectAll}
                />
                <span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-[0.25em] antialiased">
                  {currentFolder === "trash" ? "Trash" : "Messages"}
                  {filteredEmails.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-muted rounded-full text-[9px] tracking-normal">
                      {filteredEmails.length}
                    </span>
                  )}
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
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl px-4 border-none flex items-center gap-2 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Empty Trash
                    </Button>
                  </ConfirmModal>
                )}
                
                {selectedEmailIds.size > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="flex items-center gap-1 bg-background/80 backdrop-blur-md border border-muted/50 rounded-full px-1.5 py-1 shadow-2xl ring-1 ring-white/10"
                  >
                    <ConfirmModal
                      onConfirm={handleBatchDelete}
                      title={currentFolder === 'trash' ? "Delete Permanently?" : "Move to Trash?"}
                      description={`Are you sure you want to ${currentFolder === 'trash' ? 'permanently delete' : 'move to trash'} ${selectedEmailIds.size} selected emails?`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-full transition-all active:scale-90"
                        title={currentFolder === 'trash' ? "Delete Permanently" : "Move to Trash"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ConfirmModal>

                    <Separator orientation="vertical" className="h-4 mx-1 opacity-50" />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-full transition-all active:scale-90"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] shadow-2xl p-2 border-muted/20 backdrop-blur-xl bg-background/95 ring-1 ring-black/5">
                        <div 
                          className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all font-bold tracking-tight"
                          onClick={() => handleBatchMarkAsRead(true)}
                        >
                          <MailOpen className="w-4 h-4 opacity-70" />
                          <span>Mark as Read</span>
                        </div>
                        <div 
                          className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all font-bold tracking-tight"
                          onClick={() => handleBatchMarkAsRead(false)}
                        >
                          <Mail className="w-4 h-4 opacity-70" />
                          <span>Mark as Unread</span>
                        </div>
                        {currentFolder !== 'archive' && (
                          <div 
                            className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all font-bold tracking-tight"
                            onClick={handleBatchArchive}
                          >
                            <Archive className="w-4 h-4 opacity-70" />
                            <span>Archive Selected</span>
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                )}
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
                  <motion.div
                    key={email.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 cursor-pointer transition-all duration-300 relative group border-b border-muted/30 ${selectedEmail?.id === email.id ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-muted/40"} ${!email.is_read ? "bg-background" : ""}`}
                    onClick={() => {
                      setSelectedEmail(email);
                      markAsRead(email);
                    }}
                  >
                    {!email.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                    )}
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-3 shrink-0 pt-0.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-muted-foreground/30 cursor-pointer accent-primary transition-all"
                          checked={selectedEmailIds.has(email.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => toggleEmailSelection(email.id)}
                        />
                        <Avatar className="h-10 w-10 ring-2 ring-background shadow-md shrink-0 transition-transform group-hover:scale-105">
                          <AvatarImage src={email.sender?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-xs font-bold">
                            {email.sender?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-sm truncate ${!email.is_read ? "font-bold text-foreground" : "font-semibold text-muted-foreground/80"}`}
                          >
                            {email.sender?.full_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider">
                            {format(new Date(email.created_at), "MMM d")}
                          </span>
                        </div>
                        <h4
                          className={`text-[13px] truncate mb-0.5 leading-snug tracking-tight ${!email.is_read ? "font-bold text-foreground" : "font-medium text-muted-foreground/70"}`}
                        >
                          {email.subject}
                        </h4>
                        <p className="text-xs text-muted-foreground/50 line-clamp-1 leading-relaxed antialiased">
                          {email.body}
                        </p>
                      </div>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
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
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Email Preview */}
          <div
            className={`flex-1 flex flex-col bg-background relative ${!selectedEmail ? "hidden lg:flex items-center justify-center" : "flex overflow-hidden"}`}
          >
            <AnimatePresence mode="wait">
              {selectedEmail ? (
                <motion.div
                  key={selectedEmail.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col h-full"
                >
                  <header className="h-16 border-b flex items-center justify-between px-6 sticky top-0 bg-background/80 backdrop-blur-md z-10">
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-10 w-10 hover:bg-muted transition-all active:scale-95"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] shadow-2xl p-2 border-muted/20 backdrop-blur-xl bg-background/95 ring-1 ring-black/5">
                        <div className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all font-bold tracking-tight">
                          <Reply className="w-4 h-4 opacity-70" />
                          <span>Reply to Message</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all font-bold tracking-tight">
                          <Forward className="w-4 h-4 opacity-70" />
                          <span>Forward Message</span>
                        </div>
                        <Separator className="my-2 opacity-50" />
                        <div className="flex items-center gap-3 px-3 py-3 text-sm hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all font-bold tracking-tight">
                          <Star className="w-4 h-4 opacity-70" />
                          <span>{selectedEmail.is_starred ? 'Unstar' : 'Star'} Message</span>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-3 text-sm text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer transition-all font-bold tracking-tight">
                          <Trash2 className="w-4 h-4 opacity-70" />
                          <span>Move to Trash</span>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </header>
                <ScrollArea className="flex-1">
                  <div className="max-w-4xl mx-auto p-8 md:p-12 space-y-12">
                    <div className="flex items-start justify-between">
                      <div className="space-y-6 flex-1">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-[1.1] antialiased">
                          {selectedEmail.subject}
                        </h1>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-muted/50 w-fit">
                          <Avatar className="h-12 w-12 ring-2 ring-background shadow-xl">
                            <AvatarImage
                              src={selectedEmail.sender?.avatar_url}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xl font-bold">
                              {selectedEmail.sender?.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm uppercase tracking-tight">
                                {selectedEmail.sender?.full_name}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded-md lowercase tracking-normal">
                                {selectedEmail.sender?.email}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-widest mt-0.5">
                              {format(
                                new Date(selectedEmail.created_at),
                                "MMMM d, yyyy • HH:mm",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap text-[15px] font-medium tracking-normal antialiased">
                      {selectedEmail.body}
                    </div>

                    {selectedEmail.attachment_url && (
                      <div className="p-6 rounded-[2rem] border-2 border-dashed border-muted/50 bg-muted/10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-6 px-2">
                          Attachments
                        </h4>
                        <div className="flex items-center gap-5 p-5 rounded-2xl bg-background border border-muted/50 shadow-sm group hover:shadow-xl transition-all duration-500 w-fit min-w-[320px]">
                          <div className="p-4 rounded-xl bg-primary/10 text-primary shadow-inner">
                            <Paperclip className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold truncate tracking-tight">
                              {selectedEmail.attachment_name}
                            </span>
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">
                              Download Attachment
                            </span>
                          </div>
                          <a
                            href={selectedEmail.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="pt-8 border-t border-muted/30">
                      <div className="flex flex-wrap gap-4">
                        <Button
                          variant="outline"
                          className="rounded-2xl px-8 h-12 border-2 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 font-bold tracking-tight shadow-sm"
                          onClick={() => handleReplyEmail(selectedEmail)}
                        >
                          <Reply className="w-4 h-4 mr-2.5" />
                          Reply
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl px-8 h-12 border-2 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 font-bold tracking-tight shadow-sm"
                          onClick={() => handleForwardEmail(selectedEmail)}
                        >
                          <Forward className="w-4 h-4 mr-2.5" />
                          Forward
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="relative mb-10 group">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 group-hover:scale-175 transition-transform duration-1000" />
                    <div className="relative z-10 w-32 h-32 flex items-center justify-center rounded-[3rem] bg-gradient-to-br from-background to-muted shadow-2xl border border-muted-foreground/10 group-hover:rotate-6 transition-transform duration-500">
                      <Inbox className="w-16 h-16 text-primary/30" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-foreground tracking-tight mb-4">
                    Ready for focus?
                  </h3>
                  <p className="text-muted-foreground/60 max-w-[280px] leading-relaxed font-semibold uppercase text-[10px] tracking-[0.2em] antialiased">
                    Select a conversation to start reading and collaborating.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SidebarInset>

      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-background/80 backdrop-blur-2xl ring-1 ring-white/10">
          <DialogHeader className="px-8 py-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-muted/20">
            <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                <Plus className="w-6 h-6" />
              </div>
              New Message
            </DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 px-1">
                Recipient
              </label>
              <Select onValueChange={setComposeTo} value={composeTo}>
                <SelectTrigger className="h-16 rounded-[1.5rem] bg-muted/20 border-2 border-transparent focus:border-primary/20 focus:ring-0 transition-all text-base px-6 shadow-inner hover:bg-muted/30">
                  <SelectValue placeholder="Select a team member..." />
                </SelectTrigger>
                <SelectContent className="rounded-[1.5rem] border-muted/20 shadow-2xl p-2 backdrop-blur-xl bg-background/95 ring-1 ring-black/5">
                  {members
                    .filter((m) => m.user_id !== user?.id)
                    .map((member) => (
                      <SelectItem
                        key={member.id}
                        value={member.user_id}
                        className="rounded-xl py-3 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-9 w-9 ring-2 ring-background shadow-md">
                            <AvatarImage
                              src={member.user_profiles?.avatar_url}
                            />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                              {member.user_profiles?.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{member.user_profiles?.full_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 px-1">
                Subject
              </label>
              <Input
                placeholder="What's this about?"
                className="h-16 rounded-[1.5rem] bg-muted/20 border-2 border-transparent focus:border-primary/20 focus:ring-0 transition-all text-lg px-6 shadow-inner font-bold tracking-tight hover:bg-muted/30"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/50 px-1">
                Message Content
              </label>
              <textarea
                placeholder="Write your message here..."
                className="w-full min-h-[240px] p-6 rounded-[2rem] bg-muted/20 border-2 border-transparent focus:border-primary/20 focus:ring-0 transition-all text-base resize-none shadow-inner font-medium leading-relaxed hover:bg-muted/30 placeholder:text-muted-foreground/40"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
            </div>

            {composeAttachment && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-4 group"
              >
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-sm">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold truncate">
                    {composeAttachment.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Attachment Ready</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                  onClick={() => setComposeAttachment(null)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </div>
          <DialogFooter className="px-8 py-6 bg-gradient-to-r from-transparent to-primary/5 border-t border-muted/20 flex items-center justify-between sm:justify-between">
            <div className="flex items-center gap-2">
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button
                variant="ghost"
                className="rounded-2xl font-bold gap-2 px-6 h-12 hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip
                  className={`w-5 h-5 ${isUploading ? "animate-spin" : ""}`}
                />
                {isUploading ? "Uploading..." : "Attach File"}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="rounded-2xl font-bold px-6 h-12 hover:bg-muted/50 transition-all active:scale-95"
                onClick={() => setIsComposeOpen(false)}
              >
                Discard
              </Button>
              <Button
                className="rounded-2xl px-10 h-12 font-bold shadow-2xl shadow-primary/30 transition-all hover:scale-[1.05] hover:shadow-primary/40 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none"
                onClick={handleSendEmail}
                disabled={isUploading}
              >
                <Send className="w-5 h-5 mr-3" />
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
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-background/80 backdrop-blur-2xl ring-1 ring-white/10">
          <DialogHeader className="px-8 py-6 bg-gradient-to-r from-primary/5 to-transparent border-b border-muted/20">
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                <Clock className="w-5 h-5" />
              </div>
              Snoozed & Reminders
            </DialogTitle>
          </DialogHeader>
          <div className="p-10 text-center space-y-6">
            <div className="relative mb-8 inline-block">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl relative z-10">
                  <Clock className="w-20 h-20 text-primary" />
                </div>
              </motion.div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">Reminder System</h3>
              <p className="text-base text-muted-foreground/80 font-medium leading-relaxed px-4">
                We're crafting a state-of-the-art reminder system. Soon you'll be able to snooze conversations and set smart follow-up alerts that sync across all your devices.
              </p>
            </div>
          </div>
          <DialogFooter className="px-8 py-6 bg-muted/10 border-t border-muted/20">
            <Button
              className="w-full rounded-2xl font-bold h-14 text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none"
              onClick={() => setIsSnoozeModalOpen(false)}
            >
              Got it, thanks!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
