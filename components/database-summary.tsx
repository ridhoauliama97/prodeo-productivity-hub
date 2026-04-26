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

  // Basic Stats (Root Tasks only)
  const rootRows = rows.filter((r) => !r.parent_row_id);
  const totalRootTasks = rootRows.length;
  const completedRootTasks = rootRows.filter((r) =>
    isRowCompleted(r.properties),
  ).length;
  const overallPercentage =
    totalRootTasks > 0 ? (completedRootTasks / totalRootTasks) * 100 : 0;

  // Parent vs Subtask Logic (Rows that have children)
  const parentRows = rows.filter((r) =>
    rows.some((child) => child.parent_row_id === r.id),
  );
  const rootParents = parentRows.filter((r) => !r.parent_row_id);
  const subParents = parentRows.filter((r) => !!r.parent_row_id);

  const parentStats = parentRows.map((parent) => {
    const directChildren = rows.filter(
      (child) => child.parent_row_id === parent.id,
    );
    const completedChildren = directChildren.filter((child) =>
      isRowCompleted(child.properties),
    );
    const completionRate =
      directChildren.length > 0
        ? completedChildren.length / directChildren.length
        : 0;
    return {
      id: parent.id,
      isFullyCompleted: completionRate === 1 && directChildren.length > 0,
      completionRate,
      totalChildren: directChildren.length,
      completedChildren: completedChildren.length,
    };
  });

  const fullyCompletedParentsCount = parentStats.filter(
    (p) => p.isFullyCompleted,
  ).length;
  const avgParentProgress =
    parentStats.length > 0
      ? (parentStats.reduce((acc, curr) => acc + curr.completionRate, 0) /
          parentStats.length) *
        100
      : 0;

  const generateSummary = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const titleField = fields.find((f) => f.is_title_field) || fields[0];
      const topParents = parentRows
        .slice(0, 3)
        .map((r) => r.properties[titleField?.id || ""] || "Unnamed Parent");

      let text = `Analisis Data: Dari total ${totalRootTasks} tugas utama, ${completedRootTasks} telah selesai (${overallPercentage.toFixed(1)}%).\n\n`;

      if (parentRows.length > 0) {
        text += `Struktur Hirarki: Terdapat ${parentRows.length} tugas yang bertindak sebagai induk. `;
        text += `${fullyCompletedParentsCount} di antaranya telah menyelesaikan seluruh sub-tugasnya. `;
        text += `Rata-rata progres penyelesaian sub-tugas secara kolektif adalah ${avgParentProgress.toFixed(1)}%.\n\n`;
      }

      if (overallPercentage === 100) {
        text += "Status: Sempurna. Seluruh alur kerja telah tuntas.";
      } else if (avgParentProgress > 70) {
        text +=
          "Status: Progres Kuat. Fokus pada penyelesaian beberapa sub-tugas terakhir untuk menutup milestone.";
      } else {
        text +=
          "Status: Perlu Perhatian. Distribusi tugas pada sub-tugas masih belum optimal.";
      }

      setSummary(text);
      setIsGenerating(false);
    }, 1500);
  };

  useEffect(() => {
    if (rows.length > 0 && !summary && !isGenerating) {
      generateSummary();
    }
  }, [rows.length]);

  if (rows.length === 0) return null;

  return (
    <Card className="relative mt-8 bg-zinc-950/50 border-white/5 overflow-hidden group">
      <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="p-6 relative">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Enhanced Stats */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Overall Tasks */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Tasks Completed
                  </h4>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between w-full">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        {completedRootTasks}
                      </span>
                      <span className="text-xs text-zinc-500">
                        / {totalRootTasks} Total
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {overallPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={overallPercentage}
                    className="h-1 bg-zinc-800"
                  />
                </div>
              </div>

              {/* Parent Tasks */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                  </div>
                  <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Parent Tasks Done
                  </h4>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {fullyCompletedParentsCount}
                    </span>
                    <span className="text-xs text-zinc-500">
                      / {parentRows.length} Parents
                    </span>
                  </div>
                  <Progress
                    value={avgParentProgress}
                    className="h-1 bg-zinc-800"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Avg. Subtask Progress: {avgParentProgress.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-summary counts */}
            <div className="flex flex-wrap gap-4 px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-zinc-400">
                  Root Parents: {rootParents.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs text-zinc-400">
                  Sub-parents: {subParents.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-zinc-400">
                  Sub-tasks:{" "}
                  {rows.length - rows.filter((r) => !r.parent_row_id).length}
                </span>
              </div>
            </div>
          </div>

          {/* Right: AI Actions */}
          <div className="flex-1 flex flex-col gap-4">
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
                Refresh Analysis
              </Button>
            </div>

            <div className="relative min-h-[120px] p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
              {isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium italic">
                    AI sedang menganalisis hirarki tugas...
                  </span>
                </div>
              ) : summary ? (
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line animate-in fade-in slide-in-from-bottom-1 duration-500">
                  {summary}
                </p>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-zinc-500 italic">
                    Klik tombol untuk merangkum analisis tugas.
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
