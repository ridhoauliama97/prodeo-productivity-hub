"use client";

import * as React from "react";
import {
  LayoutList,
  LayoutGrid,
  Grid3x3,
  Calendar,
  ChevronRight,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DatabaseTypeSelectorProps {
  onSelect: (type: "table" | "board" | "gallery" | "calendar") => void;
  disabled?: boolean;
}

export function DatabaseTypeSelector({
  onSelect,
  disabled,
}: DatabaseTypeSelectorProps) {
  const options = [
    {
      id: "table",
      name: "Table",
      icon: LayoutList,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "board",
      name: "Board",
      icon: LayoutGrid,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      id: "gallery",
      name: "Gallery",
      icon: Grid3x3,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      id: "calendar",
      name: "Calendar",
      icon: Calendar,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ] as const;

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Database className="w-4 h-4" />
          <span className="text-sm font-medium uppercase tracking-wider">
            Start with a database
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Setup your page</h2>
        <p className="text-muted-foreground text-lg">
          Choose a layout to get started. You can always change the view or add
          more views later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            disabled={disabled}
            className={cn(
              "group relative flex flex-col items-start p-6 text-left border rounded-xl transition-all duration-300",
              "hover:border-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
              "bg-card text-card-foreground disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <div
              className={cn(
                "p-2 rounded-lg mb-4 transition-transform group-hover:scale-110",
                option.bgColor,
                option.color,
              )}
            >
              <option.icon className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-lg">{option.name}</span>
              <ChevronRight className="w-5 h-5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </div>
          </button>
        ))}
      </div>

      <div className="pt-8 border-t">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground" />
          Or just start typing below to create a standard document.
        </p>
      </div>
    </div>
  );
}
