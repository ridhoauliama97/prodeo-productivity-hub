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
} from "lucide-react";
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
  message: string;
  action_url: string | null;
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
    if (notif.action_url) {
      onClose();
      router.push(notif.action_url);
    }
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
              {notifications.map((notif, index) => (
                <div key={notif.id}>
                  <button
                    onClick={() => navigateToNotification(notif)}
                    className={cn(
                      "w-full text-left px-6 py-4 transition-colors flex items-start justify-between group",
                      notif.read
                        ? "hover:bg-muted/30 opacity-60"
                        : "hover:bg-muted/50 bg-primary/3",
                    )}
                  >
                    <div className="flex items-start gap-3 pr-4 flex-1 min-w-0">
                      {/* Unread indicator */}
                      <div className="mt-1.5 shrink-0">
                        {!notif.read ? (
                          <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                        ) : (
                          <div className="w-2 h-2" />
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm leading-tight truncate",
                            !notif.read ? "font-semibold" : "font-medium",
                          )}
                        >
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wider">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                  </button>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
