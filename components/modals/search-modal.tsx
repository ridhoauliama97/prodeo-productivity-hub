"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FileText, Search, Clock, Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Page } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: Page[];
  onSelect: (page: Page) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  pages,
  onSelect,
}: SearchModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to get breadcrumbs for a page
  const getBreadcrumbs = React.useCallback(
    (pageId: string) => {
      const breadcrumbs: string[] = [];
      let currentPage = pages.find((p) => p.id === pageId);

      while (currentPage && currentPage.parent_page_id) {
        const parent = pages.find((p) => p.id === currentPage!.parent_page_id);
        if (parent) {
          breadcrumbs.unshift(parent.title || "Untitled");
          currentPage = parent;
        } else {
          break;
        }
      }

      return breadcrumbs;
    },
    [pages],
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Parent handle toggle logic through isOpen prop
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Search pages..."
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
        />
      </div>
      <CommandList className="max-h-[500px] overflow-y-auto">
        <CommandEmpty className="py-6 text-center text-sm">
          No results found.
        </CommandEmpty>
        <CommandGroup heading="Pages" className="px-2">
          {pages.map((page) => {
            const breadcrumbs = getBreadcrumbs(page.id);
            return (
              <CommandItem
                key={page.id}
                value={page.title || "Untitled"}
                onSelect={() => {
                  onSelect(page);
                  onClose();
                }}
                className="flex items-center gap-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-accent group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md border bg-background shadow-sm text-sm group-hover:scale-110 transition-transform">
                  {page.icon ? (
                    <span>{page.icon}</span>
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-x-2">
                    <span className="text-sm font-medium leading-none truncate">
                      {page.title || "Untitled"}
                    </span>
                    {page.is_database && (
                      <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {breadcrumbs.length > 0 && (
                    <div className="flex items-center text-[11px] text-muted-foreground/60 mt-1 truncate">
                      {breadcrumbs.map((bc, i) => (
                        <React.Fragment key={i}>
                          <span>{bc}</span>
                          {i < breadcrumbs.length - 1 && (
                            <span className="mx-1">/</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
                <div className="hidden group-hover:block ml-auto text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded border">
                  Jump to
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-between border-t p-3 text-[10px] text-muted-foreground bg-muted/30">
        <div className="flex items-center gap-x-4">
          <span className="flex items-center gap-x-1">
            <kbd className="rounded bg-muted border border-border px-1.5 py-0.5">
              Enter
            </kbd>{" "}
            to select
          </span>
          <span className="flex items-center gap-x-1">
            <kbd className="rounded bg-muted border border-border px-1.5 py-0.5">
              ↑↓
            </kbd>{" "}
            to navigate
          </span>
        </div>
        <span className="flex items-center gap-x-1">
          <kbd className="rounded bg-muted border border-border px-1.5 py-0.5">
            Esc
          </kbd>{" "}
          to close
        </span>
      </div>
    </CommandDialog>
  );
}
