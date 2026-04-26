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

  const rootRows = rows.filter((r) => !r.parent_row_id);
  const totalRootTasks = rootRows.length;
  const completedRootTasks = rootRows.filter((r) =>
    isRowCompleted(r.properties),
  ).length;
  const overallPercentage =
    totalRootTasks > 0 ? (completedRootTasks / totalRootTasks) * 100 : 0;

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
      let text = `[Analysis] Dari total ${totalRootTasks} tugas utama, sebanyak ${completedRootTasks} sudah berhasil diselesaikan (${overallPercentage.toFixed(1)}%). Secara keseluruhan, progres kerja Anda saat ini terlihat ${overallPercentage > 80 ? "sangat bagus" : overallPercentage > 50 ? "cukup baik" : "masih awal"}.\n\n`;

      if (parentRows.length > 0) {
        text += `[Hierarchy] Untuk tugas yang memiliki sub-tugas, ada ${fullyCompletedParentsCount} dari ${parentRows.length} tugas induk yang sudah tuntas sepenuhnya. Rata-rata progres sub-tugas Anda saat ini adalah ${avgParentProgress.toFixed(1)}%.\n\n`;
      }

      if (overallPercentage === 100) {
        text += "[Status] Luar Biasa: Semua target sudah tercapai 100%. Tidak ada lagi tugas yang tertunda!";
      } else if (avgParentProgress > 70) {
        text += "[Status] Progres Bagus: Sebagian besar tugas sudah beres. Tinggal selesaikan beberapa sub-tugas lagi untuk mencapai target penuh.";
      } else {
        text += "[Status] Perlu Fokus: Masih ada cukup banyak tugas yang belum selesai. Yuk, mulai fokus selesaikan tugas-tugas yang masih tertunda.";
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

  // Helper to parse summary
  const getSection = (marker: string) => {
    if (!summary) return null;
    const regex = new RegExp(`\\[${marker}\\]\\s*(.*?)(?=\\n\\n|\\[|$)`, "s");
    const match = summary.match(regex);
    return match ? match[1].trim() : null;
  };

  const analysisText = getSection("Analysis");
  const hierarchyText = getSection("Hierarchy");
  const statusText = getSection("Status");

  const statusColor = statusText?.includes("Sempurna") 
    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
    : statusText?.includes("Progres Kuat")
      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
      : "bg-amber-500/10 text-amber-500 border-amber-500/20";

  return (
    <Card className="relative mt-8 bg-card dark:bg-zinc-950 border-border/50 dark:border-white/5 overflow-hidden group shadow-xl transition-all duration-500 hover:shadow-indigo-500/5">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full -mr-48 -mt-48 opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full -ml-48 -mb-48 opacity-50 pointer-events-none" />

      <div className="p-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: Dashboard Widgets (5/12 cols) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Project Analytics</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 flex-1">
              {/* Task Completion Widget */}
              <div className="p-5 rounded-2xl bg-muted/20 dark:bg-white/[0.02] border border-border/40 dark:border-white/5 backdrop-blur-sm transition-all hover:bg-muted/30 dark:hover:bg-white/[0.04]">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black tracking-tight">{overallPercentage.toFixed(0)}%</span>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Completion</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Primary Tasks</span>
                    <span className="font-bold">{completedRootTasks} <span className="text-muted-foreground/50 font-normal">/ {totalRootTasks}</span></span>
                  </div>
                  <Progress value={overallPercentage} className="h-2 bg-muted dark:bg-zinc-800" />
                </div>
              </div>

              {/* Hierarchy Widget */}
              <div className="p-5 rounded-2xl bg-muted/20 dark:bg-white/[0.02] border border-border/40 dark:border-white/5 backdrop-blur-sm transition-all hover:bg-muted/30 dark:hover:bg-white/[0.04]">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black tracking-tight">{avgParentProgress.toFixed(0)}%</span>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Hierarchy Progress</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Induk Tuntas</span>
                    <span className="font-bold">{fullyCompletedParentsCount} <span className="text-muted-foreground/50 font-normal">/ {parentRows.length}</span></span>
                  </div>
                  <Progress value={avgParentProgress} className="h-2 bg-muted dark:bg-zinc-800" />
                </div>
              </div>
            </div>

            {/* Micro Stats Bar */}
            <div className="flex items-center justify-between px-2 pt-2">
              {[
                { label: "Root", count: rootParents.length, color: "bg-blue-500" },
                { label: "Sub-parent", count: subParents.length, color: "bg-purple-500" },
                { label: "Sub-task", count: rows.length - rootRows.length, color: "bg-emerald-500" }
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", s.color)} />
                  <span className="text-[10px] font-bold text-muted-foreground/70 uppercase">{s.label}: {s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: AI Summary Panel (7/12 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/50 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">AI Intelligence</h4>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Real-time Summary</p>
                </div>
              </div>
              <Button
                onClick={generateSummary}
                disabled={isGenerating}
                variant="ghost"
                size="sm"
                className="h-8 text-xs hover:bg-muted dark:hover:bg-white/5 gap-2 px-3 border border-border/50"
              >
                <Sparkles className={cn("w-3 h-3", isGenerating && "animate-spin")} />
                Refresh
              </Button>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col gap-4">
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
                  <div className="flex gap-1.5">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <div 
                        key={i} 
                        className="w-2 h-2 bg-primary rounded-full animate-bounce" 
                        style={{ animationDelay: `-${delay}s` }} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium italic animate-pulse">Menghasilkan analisis data cerdas...</p>
                </div>
              ) : summary ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700">
                  {/* Analysis Block */}
                  {analysisText && (
                    <div className="flex gap-4 items-start group/block">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-primary/40 group-hover/block:bg-primary transition-colors" />
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        {analysisText}
                      </p>
                    </div>
                  )}
                  
                  {/* Hierarchy Block */}
                  {hierarchyText && (
                    <div className="flex gap-4 items-start group/block">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-primary/40 group-hover/block:bg-primary transition-colors" />
                      <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        {hierarchyText}
                      </p>
                    </div>
                  )}

                  {/* Status Badge Block */}
                  {statusText && (
                    <div className={cn(
                      "mt-4 p-4 rounded-xl border flex items-center gap-4 transition-all duration-500",
                      statusColor
                    )}>
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-bold leading-snug">
                        {statusText}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border/20 rounded-2xl">
                  <p className="text-sm text-muted-foreground italic">Klik refresh untuk memulai analisis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
