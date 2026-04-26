"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth-context";
import { fetchWorkspaceById, fetchWorkspaceMembers } from "@/lib/api-client";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub as DropdownMenuSubMenu,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Hash,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Smile,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  File as FileIcon,
  Maximize2,
  CheckCheck,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const supabase = createClient();

  const [workspace, setWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null); // null means Group Chat
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox State
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  // Presence State
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Media Gallery State
  const [isMediaGalleryOpen, setIsMediaGalleryOpen] = useState(false);

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
        setLoading(false);
        fetchMessages(null); // Load group chat by default
      } catch (err) {
        console.error("Error initializing chat:", err);
        setLoading(false);
      }
    };

    init();
  }, [user, authLoading, workspaceId]);

  useEffect(() => {
    // Real-time subscription & Presence
    const channel = supabase.channel(`chat-${workspaceId}`, {
      config: {
        presence: {
          key: user?.id,
        },
      },
    });

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const msg = payload.new;
          const isDirect = !!msg.receiver_id;
          const currentIsDirect = !!selectedMember;

          if (isDirect === currentIsDirect) {
            if (isDirect) {
              if (
                (msg.sender_id === selectedMember?.user_id &&
                  msg.receiver_id === user?.id) ||
                (msg.sender_id === user?.id &&
                  msg.receiver_id === selectedMember?.user_id)
              ) {
                fetchSenderProfile(msg);
                // If we are the receiver, mark as read
                if (msg.receiver_id === user?.id) {
                  markAsRead([msg.id]);
                }
              }
            } else {
              fetchSenderProfile(msg);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          // Update messages state when read status changes
          const updatedMsg = payload.new;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMsg.id
                ? { ...m, is_read: updatedMsg.is_read }
                : m,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Simplest way is to refetch messages when a deletion occurs
          fetchMessages(selectedMember);
        },
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.keys(state).forEach((key) => {
          onlineIds.add(key);
        });
        setOnlineUsers(onlineIds);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setOnlineUsers((prev) => new Set([...Array.from(prev), key]));
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, selectedMember, user?.id]);

  const fetchSenderProfile = async (msg: any) => {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", msg.sender_id)
      .single();

    const msgWithSender = { ...msg, sender: profile };
    setMessages((prev) => [...prev, msgWithSender]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchMessages = async (member: any) => {
    setFetchingMessages(true);
    try {
      let query = supabase
        .from("messages")
        .select(
          `
          *,
          sender:user_profiles!sender_id(*)
        `,
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (member) {
        // Direct message
        query = query.or(
          `and(sender_id.eq.${user?.id},receiver_id.eq.${member.user_id}),and(sender_id.eq.${member.user_id},receiver_id.eq.${user?.id})`,
        );
      } else {
        // Group chat
        query = query.is("receiver_id", null);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Auto mark unread messages as read if we are the receiver
        if (member) {
          const unreadIds = data
            .filter((m) => m.receiver_id === user?.id && !m.is_read)
            .map((m) => m.id);

          if (unreadIds.length > 0) {
            markAsRead(unreadIds);
          }
        }
        setMessages(data);
      }
    } catch (err: any) {
      console.error("Error fetching messages:", err.message || err);
    } finally {
      setFetchingMessages(false);
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    if (!messageIds.length) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .in("id", messageIds);
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleSendMessage = async (
    e: React.FormEvent,
    attachment?: { url: string; name: string },
  ) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    const content = newMessage;
    setNewMessage("");

    try {
      const { error } = await supabase.from("messages").insert({
        workspace_id: workspaceId,
        sender_id: user?.id,
        receiver_id: selectedMember?.user_id || null,
        content:
          content ||
          (attachment ? `Sent an attachment: ${attachment.name}` : ""),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("Error sending message:", err.message || err);
      toast.error("Failed to send message");
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

      // Automatically send a message with the attachment
      await handleSendMessage({ preventDefault: () => {} } as any, {
        url: publicUrl,
        name: file.name,
      });

      toast.success("File uploaded and sent", { id: toastId });
    } catch (err: any) {
      console.error("Error uploading file:", err.message || err);
      toast.error("Failed to upload file", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearConversation = async () => {
    try {
      const toastId = toast.loading("Clearing conversation...");

      // We build the query for deleting
      let deleteQuery = supabase
        .from("messages")
        .delete()
        .eq("workspace_id", workspaceId);

      if (selectedMember) {
        // Direct message deletion
        const user1 = user?.id;
        const user2 = selectedMember.user_id;
        deleteQuery = deleteQuery.or(
          `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`,
        );
      } else {
        // Group chat deletion
        deleteQuery = deleteQuery.is("receiver_id", null);
      }

      const { error } = await deleteQuery;

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      setMessages([]);
      toast.success("Conversation cleared", { id: toastId });
    } catch (err: any) {
      console.error("Error clearing conversation:", err.message || err);
      toast.error(`Failed to clear: ${err.message || "Unknown error"}`);
    }
  };

  const handleSelectMember = (member: any) => {
    if (selectedMember?.id === member?.id) return; // Already selected, do nothing
    setSelectedMember(member);
    setMessages([]); // Clear old messages instantly
    fetchMessages(member);
  };

  const COMMON_EMOJIS = [
    {
      label: "Smileys",
      emojis: [
        "😀",
        "😁",
        "😂",
        "🤣",
        "😃",
        "😄",
        "😅",
        "😆",
        "😉",
        "😊",
        "😋",
        "😎",
        "😍",
        "😘",
        "🥰",
        "😗",
        "😙",
        "😚",
        "☺️",
        "🙂",
        "🤗",
        "🤩",
        "🤔",
        "🤨",
        "😐",
        "😑",
        "😶",
        "🙄",
        "😏",
        "😣",
        "😥",
        "😮",
        "🤐",
        "😯",
        "😪",
        "😫",
        "😴",
        "😌",
        "😛",
        "😜",
        "😝",
        "🤤",
        "😒",
        "😓",
        "😔",
        "😕",
        "🙃",
        "🤑",
        "😲",
      ],
    },
    {
      label: "Gestures",
      emojis: [
        "👋",
        "🤚",
        "🖐️",
        "✋",
        "🖖",
        "👌",
        "🤌",
        "🤏",
        "✌️",
        "🤞",
        "🤟",
        "🤘",
        "🤙",
        "👈",
        "👉",
        "👆",
        "🖕",
        "👇",
        "☝️",
        "👍",
        "👎",
        "✊",
        "👊",
        "🤛",
        "🤜",
        "👏",
        "🙌",
        "👐",
        "🤲",
        "🤝",
        "🙏",
        "✍️",
        "💅",
        "🤳",
        "💪",
      ],
    },
    {
      label: "Hearts & More",
      emojis: [
        "❤️",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
        "🖤",
        "🤍",
        "🤎",
        "💔",
        "❣️",
        "💕",
        "💞",
        "💓",
        "💗",
        "💖",
        "💘",
        "💝",
        "💟",
        "✨",
        "🔥",
        "🚀",
        "💡",
        "💎",
        "🌈",
        "🎁",
        "📅",
        "📍",
        "💯",
      ],
    },
  ];

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar
          workspace={null}
          pages={[]}
          selectedPageId={null}
          onSelectPage={() => {}}
          onCreatePage={() => {}}
          onDeletePage={() => {}}
          onOpenSearch={() => {}}
          onOpenSettings={() => {}}
          onOpenProfile={() => {}}
          onOpenInbox={() => {}}
        />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading chat...
              </span>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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

      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              {selectedMember ? (
                <>
                  <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                    <AvatarImage
                      src={selectedMember.user_profiles?.avatar_url}
                    />
                    <AvatarFallback>
                      {selectedMember.user_profiles?.full_name?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col -space-y-0.5">
                    <span className="text-sm font-bold">
                      {selectedMember.user_profiles?.full_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                      Direct Message
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Hash className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      Workspace Chat
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Team communication
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => setIsMediaGalleryOpen(true)}
                  className="cursor-pointer"
                >
                  View All Media
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsSearchOpen(true)}
                  className="cursor-pointer"
                >
                  Search in Conversation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ConfirmModal
                  onConfirm={handleClearConversation}
                  title="Clear Conversation?"
                  description="This will permanently delete all messages in this chat for everyone. This action cannot be undone."
                >
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Clear Conversation
                  </DropdownMenuItem>
                </ConfirmModal>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Sidebar (Members) */}
          <div className="w-72 border-r bg-muted/20 hidden md:flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2">
                    Channels
                  </h3>
                  <Button
                    variant={!selectedMember ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 h-11 px-3 rounded-xl transition-all ${!selectedMember ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted"}`}
                    onClick={() => handleSelectMember(null)}
                  >
                    <Hash className="w-4 h-4" />
                    <span className="font-medium">General Chat</span>
                  </Button>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-2">
                    Members
                  </h3>
                  <div className="space-y-1">
                    {members
                      .filter((m) => m.user_id !== user?.id)
                      .map((member) => {
                        const isOnline = onlineUsers.has(member.user_id);
                        return (
                          <Button
                            key={member.id}
                            variant={
                              selectedMember?.id === member.id
                                ? "secondary"
                                : "ghost"
                            }
                            className={`w-full h-16 px-3 rounded-xl transition-all group/member grid grid-cols-[auto_1fr] items-center gap-3 justify-start ${selectedMember?.id === member.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                            onClick={() => handleSelectMember(member)}
                          >
                            <div className="relative shrink-0 flex items-center justify-center w-10">
                              <Avatar className="h-10 w-10 ring-2 ring-background transition-transform group-hover/member:scale-105">
                                <AvatarImage
                                  src={member.user_profiles?.avatar_url}
                                />
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                  {member.user_profiles?.full_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-background ${isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted-foreground/40"}`}
                              />
                            </div>

                            <div className="flex flex-col items-start justify-center min-w-0 text-left">
                              <div className="text-[14px] font-bold truncate w-full tracking-tight text-foreground/90 leading-tight">
                                {member.user_profiles?.full_name}
                              </div>
                              <div
                                className={`text-[10px] font-extrabold uppercase tracking-widest mt-1 leading-none ${isOnline ? "text-green-500" : "text-muted-foreground/50"}`}
                              >
                                {isOnline ? "Online" : "Offline"}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-background/50 relative overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                {fetchingMessages ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-300">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground mt-3">
                      Loading messages...
                    </span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mb-6 rotate-12 group-hover:rotate-0 transition-transform">
                      <MessageSquare className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">No messages here yet</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px] mt-2 leading-relaxed">
                      This is the beginning of your conversation. Type something
                      to get started!
                    </p>
                  </div>
                ) : null}
                <div className="space-y-6">
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === user?.id;
                    const showAvatar =
                      i === 0 || messages[i - 1].sender_id !== msg.sender_id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-4 group animate-in slide-in-from-bottom-2 duration-300 ${isMe ? "flex-row-reverse" : ""}`}
                      >
                        <div className="shrink-0">
                          {showAvatar ? (
                            <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
                              <AvatarImage src={msg.sender?.avatar_url} />
                              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                {msg.sender?.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-9" />
                          )}
                        </div>
                        <div
                          className={`flex flex-col max-w-[80%] md:max-w-[65%] ${isMe ? "items-end" : ""}`}
                        >
                          {showAvatar && (
                            <div
                              className={`flex items-center gap-2 mb-1.5 px-1 ${isMe ? "flex-row-reverse" : ""}`}
                            >
                              <span className="text-[11px] font-bold text-foreground/80">
                                {msg.sender?.full_name}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-muted-foreground font-medium">
                                  {format(new Date(msg.created_at), "HH:mm")}
                                </span>
                                {isMe && (
                                  <CheckCheck
                                    className={`w-3 h-3 transition-colors ${msg.is_read ? "text-sky-400" : "text-muted-foreground/50"}`}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm transition-all hover:shadow-md ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted/80 backdrop-blur-sm rounded-tl-none border"
                            }`}
                          >
                            {msg.content}
                            {msg.attachment_url && (
                              <div className="mt-3 space-y-2">
                                {msg.attachment_name?.match(
                                  /\.(jpg|jpeg|png|gif|webp)$/i,
                                ) ? (
                                  <div
                                    className="relative rounded-xl overflow-hidden border bg-background/50 group/media cursor-zoom-in"
                                    onClick={() =>
                                      setLightboxMedia({
                                        url: msg.attachment_url,
                                        name: msg.attachment_name,
                                        type: "image",
                                      })
                                    }
                                  >
                                    <img
                                      src={msg.attachment_url}
                                      alt={msg.attachment_name}
                                      className="max-h-[300px] w-full object-cover transition-transform group-hover/media:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors flex items-center justify-center">
                                      <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover/media:opacity-100 transition-opacity drop-shadow-lg" />
                                    </div>
                                  </div>
                                ) : msg.attachment_name?.match(
                                    /\.(mp4|webm|ogg)$/i,
                                  ) ? (
                                  <div className="relative rounded-xl overflow-hidden border bg-black group/media max-h-[450px] w-full flex items-center justify-center shadow-inner">
                                    <video
                                      className="w-full h-full max-h-[450px] object-contain"
                                      controls
                                      preload="metadata"
                                    >
                                      <source src={msg.attachment_url} />
                                      Your browser does not support the video
                                      tag.
                                    </video>
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                      onClick={() =>
                                        setLightboxMedia({
                                          url: msg.attachment_url,
                                          name: msg.attachment_name,
                                          type: "video",
                                        })
                                      }
                                    >
                                      <Maximize2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div
                                    className={`p-3 rounded-xl border flex items-center gap-3 ${isMe ? "bg-white/10 border-white/20" : "bg-background/50 border-border"}`}
                                  >
                                    <div
                                      className={`p-2.5 rounded-lg ${isMe ? "bg-white/20" : "bg-primary/10"}`}
                                    >
                                      {msg.attachment_name?.endsWith(".pdf") ? (
                                        <FileText className="w-5 h-5" />
                                      ) : (
                                        <FileIcon className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div className="flex flex-col overflow-hidden flex-1">
                                      <span className="text-[12px] font-bold truncate">
                                        {msg.attachment_name}
                                      </span>
                                      <a
                                        href={msg.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-[10px] flex items-center gap-1 font-medium mt-0.5 hover:underline ${isMe ? "text-white" : "text-primary"}`}
                                      >
                                        <Download className="w-3 h-3" />
                                        Download File
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 md:p-6 border-t bg-background/80 backdrop-blur-md">
              <form
                onSubmit={handleSendMessage}
                className="max-w-4xl mx-auto relative"
              >
                <div className="bg-muted/30 rounded-[24px] border shadow-sm transition-all focus-within:shadow-md focus-within:border-primary/50 focus-within:bg-background">
                  <div className="flex items-end gap-2 p-2">
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground rounded-full hover:bg-primary/5 hover:text-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Paperclip
                        className={`w-5 h-5 ${isUploading ? "animate-pulse text-primary" : ""}`}
                      />
                    </Button>
                    <textarea
                      rows={1}
                      placeholder={
                        selectedMember
                          ? `Message @${selectedMember.user_profiles?.full_name}...`
                          : "Message the group..."
                      }
                      className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2.5 px-1 text-sm min-h-[40px] max-h-[200px]"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <div className="flex items-center gap-1 pb-0.5 pr-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground rounded-full hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            <Smile className="w-5 h-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-80 p-0 bg-zinc-950 border-white/10 shadow-2xl"
                          side="top"
                          align="end"
                          sideOffset={10}
                        >
                          <div className="p-3">
                            <ScrollArea className="h-72">
                              <div className="space-y-4">
                                {COMMON_EMOJIS.map((category) => (
                                  <div key={category.label}>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
                                      {category.label}
                                    </h4>
                                    <div className="grid grid-cols-8 gap-1">
                                      {category.emojis.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() =>
                                            handleEmojiSelect(emoji)
                                          }
                                          className="h-8 w-8 flex items-center justify-center text-lg rounded-md hover:bg-white/10 transition-colors"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="submit"
                        size="icon"
                        className={`h-10 w-10 rounded-full shadow-lg transition-all transform active:scale-95 ${newMessage.trim() ? "bg-primary shadow-primary/20 scale-100" : "bg-muted text-muted-foreground scale-90"}`}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-center text-muted-foreground mt-3 font-medium tracking-wide uppercase opacity-50">
                  <span className="font-bold">Enter</span> to send •{" "}
                  <span className="font-bold">Shift + Enter</span> for new line
                </p>
              </form>
            </div>
          </div>
        </div>
      </SidebarInset>

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

      {/* Lightbox Modal */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-100 bg-black/95 backdrop-blur-sm animate-in fade-in duration-300 flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 text-white bg-linear-to-b from-black/50 to-transparent">
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-md">
                {lightboxMedia.name}
              </span>
              <span className="text-[10px] text-white/60">
                Full screen preview
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 rounded-full"
                asChild
              >
                <a
                  href={lightboxMedia.url}
                  download={lightboxMedia.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-5 h-5" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxMedia(null)}
                className="text-white hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-4">
            {lightboxMedia.type === "image" ? (
              <img
                src={lightboxMedia.url}
                alt={lightboxMedia.name}
                className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300"
              />
            ) : (
              <video
                controls
                autoPlay
                className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300"
              >
                <source src={lightboxMedia.url} />
              </video>
            )}
          </div>
        </div>
      )}
      {/* Media Gallery Modal */}
      <Dialog open={isMediaGalleryOpen} onOpenChange={setIsMediaGalleryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Shared Media
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {
                  messages.filter(
                    (m) =>
                      m.attachment_url &&
                      m.attachment_name?.match(
                        /\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg)$/i,
                      ),
                  ).length
                }{" "}
                items
              </span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1">
              {messages
                .filter(
                  (m) =>
                    m.attachment_url &&
                    m.attachment_name?.match(
                      /\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg)$/i,
                    ),
                )
                .reverse()
                .map((msg) => (
                  <div
                    key={msg.id}
                    className="group relative aspect-square rounded-xl overflow-hidden border bg-zinc-900 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => {
                      setIsMediaGalleryOpen(false);
                      setLightboxMedia({
                        url: msg.attachment_url,
                        name: msg.attachment_name,
                        type: msg.attachment_name?.match(/\.(mp4|webm|ogg)$/i)
                          ? "video"
                          : "image",
                      });
                    }}
                  >
                    {msg.attachment_name?.match(/\.(mp4|webm|ogg)$/i) ? (
                      <>
                        <video className="w-full h-full object-cover">
                          <source src={msg.attachment_url} />
                        </video>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={msg.attachment_url}
                        alt={msg.attachment_name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2">
                      <span className="text-[9px] text-white/70 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {format(new Date(msg.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            {messages.filter(
              (m) =>
                m.attachment_url &&
                m.attachment_name?.match(
                  /\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg)$/i,
                ),
            ).length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p>No media shared in this conversation yet.</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
