"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Search,
  Book,
  Zap,
  FileText,
  Database,
  MessageSquare,
  ShieldCheck,
  Menu,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<"en" | "id">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("landing-lang") as "en" | "id";
    if (savedLang) setLang(savedLang);

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const toggleLang = (newLang: "en" | "id") => {
    setLang(newLang);
    localStorage.setItem("landing-lang", newLang);
    window.dispatchEvent(new Event("languageChange"));
  };

  const t = {
    en: {
      back: "Back",
      search: "Search docs...",
      general: "General",
      welcome: "Welcome to Prodeo",
      quickStart: "Quick Start Guide",
      features: "Product Features",
      editor: "Rich Text Editor",
      databases: "Databases & Views",
      chat: "Real-time Chat",
      resources: "Resources",
      shortcuts: "Keyboard Shortcuts",
      security: "Workspace Security",
    },
    id: {
      back: "Kembali",
      search: "Cari dokumentasi...",
      general: "Umum",
      welcome: "Selamat Datang",
      quickStart: "Panduan Cepat",
      features: "Fitur Produk",
      editor: "Editor Teks Kaya",
      databases: "Database & Tampilan",
      chat: "Chat Real-time",
      resources: "Sumber Daya",
      shortcuts: "Pintasan Keyboard",
      security: "Keamanan Workspace",
    },
  }[lang];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/workspaces"
              className="flex items-center gap-2 group transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm group-hover:shadow-primary/20">
                <ChevronLeft className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight text-sm text-foreground/80 group-hover:text-foreground">
                {t.back}
              </span>
            </Link>

            {/* Language Switcher Pill */}
            <div className="flex p-1 bg-muted/30 dark:bg-white/5 rounded-xl border border-border/50 backdrop-blur-sm shadow-inner">
              <button
                onClick={() => toggleLang("en")}
                className={cn(
                  "px-3 py-1 text-[10px] font-black rounded-lg transition-all duration-300",
                  lang === "en"
                    ? "bg-background shadow-md text-primary"
                    : "text-muted-foreground/60 hover:text-foreground",
                )}
              >
                EN
              </button>
              <button
                onClick={() => toggleLang("id")}
                className={cn(
                  "px-3 py-1 text-[10px] font-black rounded-lg transition-all duration-300",
                  lang === "id"
                    ? "bg-background shadow-md text-primary"
                    : "text-muted-foreground/60 hover:text-foreground",
                )}
              >
                ID
              </button>
            </div>
          </div>

          <div className="relative mb-8 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder={t.search}
              className="pl-10 h-10 bg-background/50 dark:bg-white/[0.02] border-border/50 focus-visible:ring-primary/20 rounded-xl transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:flex items-center gap-1">
              <kbd className="h-5 select-none items-center gap-1 rounded-md border bg-muted/50 px-1.5 font-mono text-[10px] font-bold text-muted-foreground/60 opacity-100 flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-8 pb-10">
              <div>
                <h4 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3">
                  {t.general}
                </h4>
                <div className="grid gap-1">
                  <Link
                    href="/docs#introduction"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-primary/5 hover:text-primary transition-all group/link"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/5 text-primary group-hover/link:bg-primary/10 transition-colors">
                      <Book className="h-3.5 w-3.5" />
                    </div>
                    {t.welcome}
                  </Link>
                  <Link
                    href="/docs#quick-start"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-amber-500/5 hover:text-amber-600 dark:hover:text-amber-500 transition-all group/link"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/5 text-amber-500 group-hover/link:bg-amber-500/10 transition-colors">
                      <Zap className="h-3.5 w-3.5" />
                    </div>
                    {t.quickStart}
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3">
                  {t.features}
                </h4>
                <div className="grid gap-1">
                  <Link
                    href="/docs#documents"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-blue-500/5 hover:text-blue-600 dark:hover:text-blue-500 transition-all group/link"
                  >
                    <div className="p-1.5 rounded-lg bg-blue-500/5 text-blue-500 group-hover/link:bg-blue-500/10 transition-colors">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    {t.editor}
                  </Link>
                  <Link
                    href="/docs#databases"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-500 transition-all group/link"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/5 text-emerald-500 group-hover/link:bg-emerald-500/10 transition-colors">
                      <Database className="h-3.5 w-3.5" />
                    </div>
                    {t.databases}
                  </Link>
                  <Link
                    href="/docs#collaboration"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-500 transition-all group/link"
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/5 text-purple-500 group-hover/link:bg-purple-500/10 transition-colors">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    {t.chat}
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3">
                  {t.resources}
                </h4>
                <div className="grid gap-1">
                  <Link
                    href="/docs#shortcuts"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-orange-500/5 hover:text-orange-600 dark:hover:text-orange-500 transition-all group/link"
                  >
                    <div className="p-1.5 rounded-lg bg-orange-500/5 text-orange-500 group-hover/link:bg-orange-500/10 transition-colors">
                      <Zap className="h-3.5 w-3.5" />
                    </div>
                    {t.shortcuts}
                  </Link>
                  <Link
                    href="/docs#permissions"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-xl hover:bg-rose-500/5 hover:text-rose-600 dark:hover:text-rose-500 transition-all group/link"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-500/5 text-rose-500 group-hover/link:bg-rose-500/10 transition-colors">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                    {t.security}
                  </Link>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="mt-auto pt-8 border-t border-border/40">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-foreground/70 tracking-tight">
                    PRODEO HUB
                  </p>
                  <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest">
                    © {new Date().getFullYear()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-foreground/60 text-[8px] font-black border border-border/50 uppercase tracking-tighter shadow-sm">
                    STABLE
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-600/80 dark:text-emerald-500/80">
                      v 1.2.16
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto scroll-smooth">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-5 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <Link href="/workspaces" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Book className="h-4 w-4" />
            </div>
            <span className="font-black tracking-tighter text-lg">
              PRODEO DOCS
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50">
              <button
                onClick={() => toggleLang("en")}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all",
                  lang === "en"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground",
                )}
              >
                EN
              </button>
              <button
                onClick={() => toggleLang("id")}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all",
                  lang === "id"
                    ? "bg-background shadow-sm text-primary"
                    : "text-muted-foreground",
                )}
              >
                ID
              </button>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-border/50 bg-background/50"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 p-0 bg-zinc-50 dark:bg-zinc-950 border-r"
              >
                <SheetHeader className="p-6 border-b">
                  <SheetTitle className="text-left font-black tracking-tighter">
                    PRODEO DOCS
                  </SheetTitle>
                </SheetHeader>
                <div className="p-6 flex flex-col h-[calc(100vh-80px)]">
                  <div className="relative mb-6 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      type="search"
                      placeholder={t.search}
                      className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl"
                    />
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="space-y-8">
                      <div>
                        <h4 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3">
                          {t.general}
                        </h4>
                        <div className="grid gap-1">
                          <Link
                            href="/docs#introduction"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl hover:bg-primary/5"
                          >
                            <Book className="h-3.5 w-3.5 text-primary" />
                            {t.welcome}
                          </Link>
                          <Link
                            href="/docs#quick-start"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl hover:bg-amber-500/5"
                          >
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            {t.quickStart}
                          </Link>
                        </div>
                      </div>
                      <div>
                        <h4 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3">
                          {t.features}
                        </h4>
                        <div className="grid gap-1">
                          <Link
                            href="/docs#documents"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl hover:bg-blue-500/5"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                            {t.editor}
                          </Link>
                          <Link
                            href="/docs#databases"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl hover:bg-emerald-500/5"
                          >
                            <Database className="h-3.5 w-3.5 text-emerald-500" />
                            {t.databases}
                          </Link>
                          <Link
                            href="/docs#collaboration"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-xl hover:bg-purple-500/5"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                            {t.chat}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="mt-auto pt-6 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-muted-foreground/60 transition-colors">
                        Version 1.2.9
                      </span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <div className="flex-1 max-w-4xl mx-auto w-full p-8 md:p-16 lg:p-20">
          {children}
        </div>
      </main>
    </div>
  );
}
