"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Inbox,
  Loader2,
  ArrowRight,
  CheckCheck,
  Circle,
  Mail,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { fetchInbox, markInboxAllRead, markInboxRead } from "@/lib/api-client";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  content?: string;
  action_url?: string | null;
  link?: string | null;
  read: boolean;
  type?: string;
  workspace_id?: string;
  row_id?: string;
  created_at: string;
  updated_at: string;
}

export function InboxModal({ isOpen, onClose }: InboxModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      loadInbox();
    }
  }, [isOpen]);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const data = await fetchInbox();
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to load inbox", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markInboxAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      // Dispatch event so sidebar badge resets
      window.dispatchEvent(new CustomEvent("inbox_marked_read"));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markInboxRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      // Dispatch event so sidebar badge decrements
      window.dispatchEvent(new CustomEvent("inbox_marked_read"));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const navigateToNotification = async (notif: NotificationItem) => {
    // Mark as read when clicking
    if (!notif.read) {
      await handleMarkRead(notif.id);
    }
    const url = notif.action_url || notif.link;
    if (url) {
      onClose();
      router.push(url);
    }
  };

  const handleAcceptInvite = async (
    token: string,
    notifId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      const formData = new FormData();
      formData.append("token", token);
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast.success("Invitation accepted! You have joined the workspace.");
        handleMarkRead(notifId);
        window.location.reload();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to accept invitation");
      }
    } catch (err) {
      toast.error("Error accepting invitation");
    }
  };

  const handleDeclineInvite = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await handleMarkRead(notifId);
    toast.info("Invitation declined.");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifikasi
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 px-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-muted-foreground">
                  When you are assigned to a task, it will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif, index) => {
                let parsedData: any = null;
                try {
                  const contentStr = notif.content || notif.message || "{}";
                  parsedData = JSON.parse(contentStr);
                } catch (e) {
                  // Not JSON, ignore
                }

                const isEmail =
                  parsedData?.type === "email" ||
                  notif.title?.startsWith("New Email:");
                const isInvite =
                  parsedData?.type === "invite" ||
                  notif.title?.startsWith("Workspace Invitation:");

                return (
                  <div key={notif.id}>
                    <button
                      onClick={() => navigateToNotification(notif)}
                      className={cn(
                        "w-full text-left px-6 py-4 transition-colors flex items-start justify-between group",
                        notif.read
                          ? "hover:bg-muted/30 opacity-60"
                          : "hover:bg-muted/50 bg-primary/5",
                      )}
                    >
                      <div className="flex items-start gap-3 pr-4 flex-1 min-w-0">
                        {/* Status Icon Indicator based on type */}
                        <div className="mt-1 shrink-0">
                          {isEmail ? (
                            <div
                              className={cn(
                                "p-1.5 rounded-full",
                                notif.read
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-blue-500/10 text-blue-500",
                              )}
                            >
                              <Mail className="w-4 h-4" />
                            </div>
                          ) : isInvite ? (
                            <div
                              className={cn(
                                "p-1.5 rounded-full",
                                notif.read
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-green-500/10 text-green-500",
                              )}
                            >
                              <UserPlus className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="mt-0.5">
                              {!notif.read ? (
                                <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                              ) : (
                                <div className="w-2 h-2" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 min-w-0 w-full">
                          {isEmail && parsedData?.senderName ? (
                            <>
                              <div className="flex justify-between items-start gap-2">
                                <span
                                  className={cn(
                                    "text-sm leading-tight truncate",
                                    !notif.read
                                      ? "font-bold text-foreground"
                                      : "font-medium text-muted-foreground",
                                  )}
                                >
                                  {parsedData.senderName}{" "}
                                  <span className="font-normal text-muted-foreground/70 text-xs">
                                    sent an email
                                  </span>
                                </span>
                                <span className="text-[10px] text-muted-foreground/70 shrink-0 mt-0.5">
                                  {formatDistanceToNow(
                                    new Date(notif.created_at),
                                    { addSuffix: true },
                                  )}
                                </span>
                              </div>
                              <p
                                className={cn(
                                  "text-xs font-semibold truncate",
                                  !notif.read
                                    ? "text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                {parsedData.subject ||
                                  notif.title.replace("New Email: ", "")}
                              </p>
                              <p className="text-xs text-muted-foreground leading-snug line-clamp-1">
                                {parsedData.preview || notif.content}
                              </p>
                            </>
                          ) : isInvite && parsedData?.workspaceName ? (
                            <>
                              <div className="flex justify-between items-start gap-2">
                                <span
                                  className={cn(
                                    "text-sm leading-tight truncate",
                                    !notif.read
                                      ? "font-bold text-foreground"
                                      : "font-medium text-muted-foreground",
                                  )}
                                >
                                  {parsedData.inviterName}{" "}
                                  <span className="font-normal text-muted-foreground/70 text-xs">
                                    invited you
                                  </span>
                                </span>
                                <span className="text-[10px] text-muted-foreground/70 shrink-0 mt-0.5">
                                  {formatDistanceToNow(
                                    new Date(notif.created_at),
                                    { addSuffix: true },
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-snug">
                                You have been invited to join the workspace{" "}
                                <span className="font-semibold text-foreground">
                                  {parsedData.workspaceName}
                                </span>
                                .
                              </p>
                              {!notif.read && parsedData?.token && (
                                <div className="flex items-center gap-2 mt-3 pt-1">
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs font-semibold px-4"
                                    onClick={(e) =>
                                      handleAcceptInvite(
                                        parsedData.token,
                                        notif.id,
                                        e,
                                      )
                                    }
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1.5" />{" "}
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-semibold px-4"
                                    onClick={(e) =>
                                      handleDeclineInvite(notif.id, e)
                                    }
                                  >
                                    <X className="w-3.5 h-3.5 mr-1.5" /> Decline
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between items-start gap-2">
                                <p
                                  className={cn(
                                    "text-sm leading-tight truncate",
                                    !notif.read
                                      ? "font-semibold"
                                      : "font-medium",
                                  )}
                                >
                                  {notif.title}
                                </p>
                                <span className="text-[10px] text-muted-foreground/70 shrink-0 mt-0.5">
                                  {formatDistanceToNow(
                                    new Date(notif.created_at),
                                    { addSuffix: true },
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                                {notif.message || notif.content}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {(!isInvite || notif.read) && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 shrink-0" />
                      )}
                    </button>
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
