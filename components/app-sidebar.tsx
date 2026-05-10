"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "next-themes";
import {
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Trash2,
  Palette,
  Monitor,
  Search,
  Bell,
  Settings,
  Check,
  Paintbrush,
  BookOpen,
  Github,
  ChevronsUpDown,
  AudioWaveform,
  Command,
  LayoutDashboard,
  Mail,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub as DropdownMenuSubMenu,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase-client";
import { fetchInboxCount, fetchWorkspacesApi } from "@/lib/api-client";
import type { Workspace, Page } from "@/lib/types";
import { ConfirmModal } from "./modals/confirm-modal";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
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

export function AppSidebar({
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
  ...props
}: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
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
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const router = useRouter();

  useEffect(() => {
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

  const unreadCount = externalUnreadCount ?? internalUnreadCount;

  useEffect(() => {
    if (!user) return;

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
        (payload) => {
          // Tiny debug helper
          console.log('notification', payload.eventType, payload)
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
        (payload) => {
          // Tiny debug helper
          console.log('notification', payload.eventType, payload)
          loadCount();
        },
      )
      .subscribe();

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

  const [emailUnreadCount, setEmailUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !workspace?.id) return;
    const supabase = createClient();

    const loadEmailCount = async () => {
      const { count } = await supabase
        .from("emails")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("receiver_id", user.id)
        .eq("folder", "inbox")
        .eq("is_read", false);
      if (count !== null) setEmailUnreadCount(count);
    };
    loadEmailCount();

    const channel = supabase
      .channel("sidebar-email-badge")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emails",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => loadEmailCount(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, workspace?.id]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenSearch();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenSearch]);

  useEffect(() => {
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

  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!user) return;
      try {
        const data = await fetchWorkspacesApi();
        setWorkspaces(data || []);
      } catch (err) {
        console.error("Failed to fetch workspaces:", err);
      }
    };
    loadWorkspaces();
  }, [user]);

  const handleWorkspaceSwitch = (id: string) => {
    router.push(`/workspace/${id}`);
  };

  const rootPages = pages.filter((p) => !p.parent_page_id);

  const renderPageTree = (page: Page, level: number = 0) => {
    const childPages = pages.filter((p) => p.parent_page_id === page.id);
    const isExpanded = !!expandedPages[page.id];
    const isSelected = selectedPageId === page.id;
    const hasChildren = childPages.length > 0;

    if (hasChildren) {
      return (
        <Collapsible
          key={page.id}
          open={isExpanded}
          onOpenChange={(open) =>
            setExpandedPages((prev) => ({ ...prev, [page.id]: open }))
          }
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isSelected}
              onClick={() => onSelectPage(page)}
              tooltip={page.title || "Untitled"}
            >
              <CollapsibleTrigger
                asChild
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <span className="flex items-center justify-center w-4 h-4 shrink-0 cursor-pointer hover:bg-sidebar-accent rounded-sm transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </span>
              </CollapsibleTrigger>
              <span className="text-base leading-none">
                {page.icon ? page.icon : page.is_database ? "📊" : "📄"}
              </span>
              <span className="truncate">{page.title || "Untitled"}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal className="w-4 h-4" />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreatePage("Untitled", false, page.id);
                    setExpandedPages((prev) => ({
                      ...prev,
                      [page.id]: true,
                    }));
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add sub-page
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
            <CollapsibleContent>
              <SidebarMenuSub>
                {childPages.map((child) => {
                  const grandChildren = pages.filter(
                    (p) => p.parent_page_id === child.id,
                  );
                  const childSelected = selectedPageId === child.id;

                  if (grandChildren.length > 0) {
                    // Recurse for nested children – wrap in a proper menu item
                    return (
                      <SidebarMenuSubItem key={child.id}>
                        <SidebarMenuSubButton
                          isActive={childSelected}
                          onClick={() => onSelectPage(child)}
                          className="cursor-pointer"
                        >
                          <span className="text-base leading-none">
                            {child.icon
                              ? child.icon
                              : child.is_database
                                ? "📊"
                                : "📄"}
                          </span>
                          <span className="truncate">
                            {child.title || "Untitled"}
                          </span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  }

                  return (
                    <SidebarMenuSubItem key={child.id}>
                      <SidebarMenuSubButton
                        isActive={childSelected}
                        onClick={() => onSelectPage(child)}
                        className="cursor-pointer"
                      >
                        <span className="text-base leading-none">
                          {child.icon
                            ? child.icon
                            : child.is_database
                              ? "📊"
                              : "📄"}
                        </span>
                        <span className="truncate">
                          {child.title || "Untitled"}
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // Leaf page (no children)
    return (
      <SidebarMenuItem key={page.id}>
        <SidebarMenuButton
          isActive={isSelected}
          onClick={() => onSelectPage(page)}
          tooltip={page.title || "Untitled"}
        >
          <span className="w-4 h-4 shrink-0" />
          <span className="text-base leading-none">
            {page.icon ? page.icon : page.is_database ? "📊" : "📄"}
          </span>
          <span className="truncate">{page.title || "Untitled"}</span>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover>
              <MoreHorizontal className="w-4 h-4" />
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCreatePage("Untitled", false, page.id);
                setExpandedPages((prev) => ({ ...prev, [page.id]: true }));
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add sub-page
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
      </SidebarMenuItem>
    );
  };

  // Appearance colors configuration
  const colorOptions = [
    { name: "Default", value: "default", class: "bg-zinc-500" },
    { name: "Indigo", value: "indigo", class: "bg-indigo-500" },
    { name: "Amber", value: "amber", class: "bg-amber-500" },
    { name: "Blue", value: "blue", class: "bg-blue-500" },
    { name: "Lime", value: "lime", class: "bg-lime-500" },
    { name: "Red", value: "red", class: "bg-red-500" },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ────── Sidebar Header: Workspace Switcher ────── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-bold">
                    {workspace?.name?.charAt(0) || "W"}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {workspace?.name || "Workspace"}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/50">
                      Prodeo Hub
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Workspaces
                </div>
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => handleWorkspaceSwitch(ws.id)}
                    className="flex items-center gap-2 px-2 py-2 cursor-pointer"
                  >
                    <div className="flex aspect-square size-6 items-center justify-center rounded-md border bg-background text-[10px] font-medium">
                      {ws.name.charAt(0)}
                    </div>
                    <span
                      className={cn(
                        "flex-1 truncate",
                        ws.id === workspace?.id && "font-semibold text-primary",
                      )}
                    >
                      {ws.name}
                    </span>
                    {ws.id === workspace?.id && (
                      <Check className="size-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/workspaces"
                    className="flex items-center gap-2 px-2 py-2 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span className="text-sm">Create or Join Workspace</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ────── Sidebar Content ────── */}
      <SidebarContent>
        {/* Quick Actions Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Home">
                  <Link
                    href={
                      workspace?.id
                        ? `/workspace/${workspace.id}`
                        : "/workspaces"
                    }
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onOpenSearch}
                  tooltip="Search (Ctrl+K)"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                  <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 group-data-[collapsible=icon]:hidden">
                    <span className="text-[10px]">⌘</span>K
                  </kbd>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenInbox} tooltip="Notifikasi">
                  <Bell className="w-4 h-4" />
                  <span>Notifikasi</span>
                </SidebarMenuButton>
                {unreadCount > 0 && (
                  <SidebarMenuBadge>
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onOpenSettings} tooltip="Settings">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Communication Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Email">
                  <Link href={`/workspace/${workspace?.id}/email`}>
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </Link>
                </SidebarMenuButton>
                {emailUnreadCount > 0 && (
                  <SidebarMenuBadge>
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-blue-500 rounded-full">
                      {emailUnreadCount > 99 ? "99+" : emailUnreadCount}
                    </span>
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Chat">
                  <Link href={`/workspace/${workspace?.id}/chat`}>
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Pages Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Pages</SidebarGroupLabel>
          <SidebarGroupAction
            title="Add Page"
            onClick={() => onCreatePage("Untitled", false)}
          >
            <Plus className="w-4 h-4" />
            <span className="sr-only">Add Page</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {rootPages.map((page) => renderPageTree(page))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ────── Sidebar Footer: User Profile ────── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt="Avatar" />
                    )}
                    <AvatarFallback className="rounded-lg bg-sidebar-accent">
                      <UserIcon className="w-4 h-4 text-sidebar-foreground/70" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {profile?.username ||
                        profile?.full_name ||
                        user?.email ||
                        "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                {/* User info header */}
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt="Avatar" />
                    )}
                    <AvatarFallback className="rounded-lg">
                      <UserIcon className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {profile?.username || profile?.full_name || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={onOpenProfile}
                  className="cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Theme submenu */}
                <DropdownMenuSubMenu>
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
                </DropdownMenuSubMenu>

                {/* Appearance submenu */}
                <DropdownMenuSubMenu>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <Paintbrush className="w-4 h-4 mr-2" />
                    Appearance
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {colorOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => handleAppearanceChange(opt.value)}
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full mr-2",
                              opt.class,
                            )}
                          />
                          {opt.name}
                        </div>
                        {appearanceColor === opt.value && (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSubMenu>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href="/docs" target="_blank">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Documentation
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <a
                    href="https://github.com/ridhoauliama97/prodeo-productivity-hub"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    GitHub repository
                  </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={signOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-2 px-4 border-t border-sidebar-border/30 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black tracking-tight text-sidebar-foreground/80">
                PRODEO HUB
              </p>
              <p className="text-[8px] font-medium text-sidebar-foreground/30 uppercase tracking-[0.2em]">
                © {new Date().getFullYear()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="px-1.5 py-0.5 rounded-md bg-sidebar-accent/50 text-sidebar-foreground/40 text-[8px] font-black border border-sidebar-border/50 uppercase tracking-tighter">
                STABLE
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-500/80">
                  v 1.2.16
                </span>
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
