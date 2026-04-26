import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";
import {
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreVertical,
  Trash2,
  ChevronsLeft,
  Palette,
  Monitor,
  Search,
  Inbox,
  Settings,
  Check,
  Paintbrush,
  BookOpen,
  Github,
  ChevronsDownUp,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase-client";
import { fetchInboxCount } from "@/lib/api-client";
import type { Workspace, Page } from "@/lib/types";
import { ConfirmModal } from "./modals/confirm-modal";

interface SidebarProps {
  workspace: Workspace | null;
  pages: Page[];
  selectedPageId: string | null;
  onSelectPage: (page: Page) => void;
  onCreatePage: (title: string, isDatabase: boolean, parentId?: string) => void;
  onDeletePage: (id: string) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenInbox: () => void;
  unreadCount?: number;
  onUnreadCountChange?: (count: number) => void;
}

export function Sidebar({
  workspace,
  pages,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onOpenSearch,
  onOpenSettings,
  onOpenProfile,
  onOpenInbox,
  unreadCount: externalUnreadCount,
  onUnreadCountChange,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>(
    {},
  );
  const [profile, setProfile] = useState<{
    full_name?: string;
    username?: string;
    avatar_url?: string;
  } | null>(null);
  const [internalUnreadCount, setInternalUnreadCount] = useState(0);
  const [appearanceColor, setAppearanceColor] = useState<string>("default");

  useEffect(() => {
    // Load initial appearance from localStorage
    const savedColor = localStorage.getItem("appearance_color");
    if (savedColor) {
      setAppearanceColor(savedColor);
      document.documentElement.setAttribute("data-color", savedColor);
    }
  }, []);

  const handleAppearanceChange = (color: string) => {
    setAppearanceColor(color);
    if (color === "default") {
      localStorage.removeItem("appearance_color");
      document.documentElement.removeAttribute("data-color");
    } else {
      localStorage.setItem("appearance_color", color);
      document.documentElement.setAttribute("data-color", color);
    }
  };

  // Use external count if provided, otherwise internal
  const unreadCount = externalUnreadCount ?? internalUnreadCount;

  // Fetch unread count on mount and set up realtime subscription
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const loadCount = async () => {
      try {
        const count = await fetchInboxCount();
        setInternalUnreadCount(count);
        onUnreadCountChange?.(count);
      } catch (err) {
        console.error("Failed to fetch inbox count:", err);
      }
    };
    loadCount();

    // Subscribe to realtime changes on the notifications table
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-badge")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // New notification arrived — increment count
          setInternalUnreadCount((prev) => {
            const next = prev + 1;
            onUnreadCountChange?.(next);
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Notification was updated (likely marked as read) — re-fetch count
          loadCount();
        },
      )
      .subscribe();

    // Also listen for a manual inbox_read event (from InboxModal)
    const handleInboxRead = () => {
      setInternalUnreadCount(0);
      onUnreadCountChange?.(0);
    };
    window.addEventListener("inbox_marked_read", handleInboxRead);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("inbox_marked_read", handleInboxRead);
    };
  }, [user]);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("user_profiles")
        .select("full_name, username, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    };

    fetchProfile();

    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener("profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile_updated", handleProfileUpdate);
    };
  }, [user]);

  const toggleExpand = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPages((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  const rootPages = pages.filter((p) => !p.parent_page_id);

  const renderPageItem = (page: Page, level: number = 0) => {
    const childPages = pages.filter((p) => p.parent_page_id === page.id);
    const isExpanded = !!expandedPages[page.id];
    const isSelected = selectedPageId === page.id;

    return (
      <div key={page.id} className="flex flex-col">
        <div
          onClick={() => onSelectPage(page)}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          className={cn(
            "group flex items-center py-1.5 pr-2 rounded-md cursor-pointer transition-colors text-sm font-medium",
            isSelected
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          )}
        >
          <div
            onClick={(e) => toggleExpand(page.id, e)}
            className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            {childPages.length > 0 ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )
            ) : (
              <div className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="mr-2 text-lg leading-none">
            {page.icon ? page.icon : page.is_database ? "📊" : "📄"}
          </div>

          <span className="flex-1 truncate">{page.title || "Untitled"}</span>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreatePage("Untitled", false, page.id);
                setExpandedPages((prev) => ({ ...prev, [page.id]: true }));
              }}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <ConfirmModal
                  onConfirm={() => onDeletePage(page.id)}
                  title="Delete Page?"
                  description="Are you sure you want to delete this page and all its content? This action cannot be undone."
                >
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </ConfirmModal>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isExpanded && childPages.length > 0 && (
          <div className="flex flex-col mt-0.5">
            {childPages.map((child) => renderPageItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div
        className="w-12 h-screen flex flex-col items-center py-4 border-r bg-sidebar transition-all cursor-pointer hover:bg-sidebar-accent"
        onClick={() => setIsCollapsed(false)}
      >
        <ChevronRight className="w-4 h-4 text-sidebar-foreground/50" />
      </div>
    );
  }

  return (
    <aside className="w-64 h-screen flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all relative group/sidebar">
      <div
        onClick={() => setIsCollapsed(true)}
        className="absolute right-0 top-0 bottom-0 w-1 hover:bg-sidebar-primary/20 cursor-col-resize z-50 transition-colors opacity-0 group-hover/sidebar:opacity-100 flex items-center justify-center"
      >
        <div className="p-1 bg-sidebar border border-sidebar-border rounded-md shadow-sm opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
          <ChevronsLeft className="w-3.5 h-3.5 text-sidebar-foreground/60" />
        </div>
      </div>

      <div className="px-4 py-3 border-b border-sidebar-border flex items-center gap-3 w-full">
        <div className="w-7 h-7 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
          {workspace?.name?.charAt(0) || "W"}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm tracking-tight truncate block">
            {workspace?.name || "Workspace"}
          </span>
          <span className="text-[11px] text-sidebar-foreground/50 truncate block">
            Prodeo Hub
          </span>
        </div>
      </div>

      <div className="px-3 pt-3 pb-1 space-y-0.5">
        <Link
          href="/workspaces"
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Home
        </Link>
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
          onClick={onOpenSearch}
        >
          <Search className="w-4 h-4" />
          Search
          <span className="ml-auto text-[10px] text-sidebar-foreground/30 font-mono">
            ⌘K
          </span>
        </button>
        <button
          className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
          onClick={onOpenInbox}
        >
          <span className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            Inbox
          </span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
          onClick={onOpenSettings}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-3 space-y-4">
        <div>
          <div className="flex items-center justify-between px-2 mb-1 group/section">
            <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
              Pages
            </span>
            <button
              onClick={() => onCreatePage("Untitled", false)}
              className="p-0.5 rounded opacity-0 group-hover/section:opacity-60 hover:opacity-100! hover:bg-sidebar-accent cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {rootPages.map((page) => renderPageItem(page))}
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent transition-colors cursor-pointer outline-none">
              <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-sidebar-foreground/70" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-sidebar-foreground">
                  {profile?.username ||
                    profile?.full_name ||
                    user?.email ||
                    "User"}
                </p>
              </div>
              <ChevronsDownUp className="w-3.5 h-3.5 text-sidebar-foreground/40 shrink-0" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="start" side="top">
            <div className="p-2 flex items-center gap-3 border-b mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-none mb-1">
                  {profile?.username || profile?.full_name || "User"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="p-1">
              <DropdownMenuItem
                onClick={onOpenProfile}
                className="cursor-pointer"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              {/* <DropdownMenuItem
                onClick={onOpenSettings}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem> */}
            </div>

            <Separator className="my-1" />

            <div className="p-1">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Palette className="w-4 h-4 mr-2" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Sun className="w-4 h-4 mr-2" />
                      Light
                    </div>
                    {theme === "light" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Moon className="w-4 h-4 mr-2" />
                      Dark
                    </div>
                    {theme === "dark" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Monitor className="w-4 h-4 mr-2" />
                      System
                    </div>
                    {theme === "system" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Paintbrush className="w-4 h-4 mr-2" />
                  Appearance
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => handleAppearanceChange("default")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-zinc-500 mr-2" />
                      Default
                    </div>
                    {appearanceColor === "default" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAppearanceChange("indigo")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2" />
                      Indigo
                    </div>
                    {appearanceColor === "indigo" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAppearanceChange("amber")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                      Amber
                    </div>
                    {appearanceColor === "amber" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAppearanceChange("blue")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                      Blue
                    </div>
                    {appearanceColor === "blue" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAppearanceChange("lime")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-lime-500 mr-2" />
                      Lime
                    </div>
                    {appearanceColor === "lime" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAppearanceChange("red")}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                      Red
                    </div>
                    {appearanceColor === "red" && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </div>

            <Separator className="my-1" />

            <div className="p-1">
              <DropdownMenuItem className="cursor-pointer">
                <BookOpen className="w-4 h-4 mr-2" />
                Documentation
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Github className="w-4 h-4 mr-2" />
                GitHub repository
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={signOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
