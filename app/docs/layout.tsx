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
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<"en" | "id">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("docs-lang") as "en" | "id";
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
    localStorage.setItem("docs-lang", newLang);
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
    }
  }[lang];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r bg-muted/30 backdrop-blur-xl sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/workspaces" className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <ChevronLeft className="h-4 w-4" />
              </div>
              <span className="font-semibold tracking-tight text-sm">{t.back}</span>
            </Link>

            {/* Language Switcher Pill */}
            <div className="flex p-1 bg-muted/50 rounded-lg border border-muted-foreground/10">
              <button
                onClick={() => toggleLang("en")}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                  lang === "en" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                EN
              </button>
              <button
                onClick={() => toggleLang("id")}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                  lang === "id" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                ID
              </button>
            </div>
          </div>
          
          <div className="relative mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder={t.search}
              className="pl-9 bg-background/50 border-muted focus-visible:ring-primary/20"
            />
            <div className="absolute right-2 top-2.5 pointer-events-none hidden lg:flex items-center gap-1">
              <kbd className="h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)] -mx-6 px-6">
            <div className="space-y-6">
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-3">
                  {t.general}
                </h4>
                <div className="grid gap-1">
                  <Link href="/docs#introduction" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                    <Book className="h-4 w-4 text-primary" />
                    {t.welcome}
                  </Link>
                  <Link href="/docs#quick-start" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                    <Zap className="h-4 w-4 text-amber-500" />
                    {t.quickStart}
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-3">
                  {t.features}
                </h4>
                <div className="grid gap-1">
                  <Link href="/docs#documents" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                    <FileText className="h-4 w-4 text-blue-500" />
                    {t.editor}
                  </Link>
                  <Link href="/docs#databases" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                    <Database className="h-4 w-4 text-green-500" />
                    {t.databases}
                  </Link>
                  <Link href="/docs#collaboration" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    {t.chat}
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-3">
                  {t.resources}
                </h4>
                <div className="grid gap-1">
                  <Link href="/docs#shortcuts" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                    <Zap className="h-4 w-4 text-orange-500" />
                    {t.shortcuts}
                  </Link>
                  <Link href="/docs#permissions" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                    <ShieldCheck className="h-4 w-4 text-rose-500" />
                    {t.security}
                  </Link>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
        
        <div className="mt-auto p-6 border-t bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
              © {new Date().getFullYear()} Prodeo Hub
            </p>
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold border border-primary/20">
              STABLE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono font-medium text-muted-foreground">Version 1.2.4</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto scroll-smooth">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <Link href="/workspaces" className="flex items-center gap-2">
            <span className="font-bold">Prodeo Docs</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex p-1 bg-muted/50 rounded-lg border border-muted-foreground/10">
              <button
                onClick={() => toggleLang("en")}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all",
                  lang === "en" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                )}
              >
                EN
              </button>
              <button
                onClick={() => toggleLang("id")}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all",
                  lang === "id" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                )}
              >
                ID
              </button>
            </div>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12 lg:p-16">
          {children}
        </div>
      </main>
    </div>
  );
}
