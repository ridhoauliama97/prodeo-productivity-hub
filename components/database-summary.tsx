"use client";

import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, TrendingUp, BrainCircuit } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DatabaseField, DatabaseRow } from "@/lib/types";

interface DatabaseSummaryProps {
  fields: DatabaseField[];
  rows: DatabaseRow[];
}

export const DatabaseSummary = ({ fields, rows }: DatabaseSummaryProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const completedStatusValues = [
    "completed",
    "accepted",
    "finished",
    "done",
    "accepted/completed",
  ];

  const isRowCompleted = (props: Record<string, any>) => {
    return fields.some((f) => {
      if (f.type !== "select") return false;
      const val = String(props[f.id] || "").toLowerCase();
      return completedStatusValues.includes(val);
    });
  };

  const totalTasks = rows.length;
  const completedTasks = rows.filter((r) =>
    isRowCompleted(r.properties),
  ).length;
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const ratioDisplay =
    totalTasks > 0 ? (completedTasks / totalTasks).toFixed(1) : "0.0";

  const generateSummary = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const taskNames = rows
        .map((r) => {
          const titleField = fields.find((f) => f.is_title_field) || fields[0];
          return r.properties[titleField?.id || ""] || "Unnamed Task";
        })
        .slice(0, 5);

      let text = `Berdasarkan ${totalTasks} tugas yang ada, ${completedTasks} tugas telah selesai (${percentage.toFixed(1)}%). `;

      if (percentage === 100) {
        text +=
          "Luar biasa! Semua tugas telah diselesaikan dengan sempurna. Tim menunjukkan produktivitas maksimal.";
      } else if (percentage > 50) {
        text +=
          "Progres sangat baik. Fokus saat ini adalah menyelesaikan sisa tugas yang tertunda untuk mencapai target tepat waktu.";
      } else {
        text +=
          "Masih banyak tugas yang perlu perhatian. Disarankan untuk memprioritaskan tugas-tugas krusial guna meningkatkan efisiensi.";
      }

      if (taskNames.length > 0) {
        text += `\n\nTugas utama meliputi: ${taskNames.join(", ")}.`;
      }

      setSummary(text);
      setIsGenerating(false);
    }, 1500);
  };

  useEffect(() => {
    if (totalTasks > 0 && !summary && !isGenerating) {
      // Auto generate on first load if rows exist
      generateSummary();
    }
  }, [totalTasks]);

  if (totalTasks === 0) return null;

  return (
    <Card className="relative mt-8 bg-zinc-950/50 border-white/5 overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="p-6 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Stats */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Completed Task
                </h3>
                <p className="text-xs text-zinc-400">
                  {completedTasks}/{totalTasks} Tasks has Completed
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">Progres Keseluruhan</span>
                <span className="text-white">
                  {percentage.toFixed(1)}% ({ratioDisplay} %)
                </span>
              </div>
              <Progress value={percentage} className="h-1.5 bg-zinc-800" />
            </div>
          </div>

          {/* Divider (Mobile Only) */}
          <div className="h-px bg-white/5 md:hidden" />

          {/* Right: AI Actions */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  AI Summarizer
                </span>
              </div>
              <Button
                onClick={generateSummary}
                disabled={isGenerating}
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] bg-white/5 hover:bg-white/10 text-white gap-1.5"
              >
                <BrainCircuit
                  className={cn("w-3 h-3", isGenerating && "animate-spin")}
                />
                Refresh Summary
              </Button>
            </div>

            <div className="relative min-h-[80px] p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
              {isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium italic">
                    AI sedang menganalisis data...
                  </span>
                </div>
              ) : summary ? (
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-bottom-1 duration-500">
                  {summary}
                </p>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-zinc-500 italic">
                    Klik tombol untuk merangkum tugas halaman ini.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
