"use client";

import { useState } from "react";
import { Plus, Trash2, Play, ChevronDown, ChevronRight, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DatabaseField, DatabaseRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DataGridCell } from "./data-grid-cell";
import { MediaPreview } from "./media-preview";

interface BoardViewProps {
  fields: DatabaseField[];
  rows: DatabaseRow[];
  groupByField?: DatabaseField;
  onAddRow: (
    row: Omit<DatabaseRow, "id" | "created_at" | "updated_at">,
  ) => void;
  onUpdateRow: (id: string, properties: Record<string, any>) => void;
  onDeleteRow: (id: string) => void;
  workspaceId: string;
  members?: any[];
}

export function BoardView({
  fields,
  rows,
  groupByField,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  workspaceId,
  members,
}: BoardViewProps) {
  const titleField = fields.find((f) => f.is_title_field);
  const [previewMedia, setPreviewMedia] = useState<{
    urls: string[];
    index: number;
  } | null>(null);

  // Group rows if groupByField is specified
  const getColumns = () => {
    const rootRows = rows.filter(r => !r.parent_row_id);
    if (!groupByField) return { "All": rootRows };
    
    const columns: Record<string, DatabaseRow[]> = {};
    
    // Default statuses for a standard Kanban flow if field name contains "status"
    const isStatusField = groupByField.name.toLowerCase().includes("status");
    const defaultStatuses = isStatusField 
      ? ["New", "On Progress", "In Review", "Rejected", "Completed"] 
      : [];

    // Combine options from field and defaults (avoiding duplicates)
    // options may be strings or objects like { label: "New", color: "#..." }
    const rawOptions = (groupByField.properties?.options || []) as any[];
    const normalizedOptions = rawOptions
      .map((opt: any) => (typeof opt === "string" ? opt : opt?.label || opt?.value || ""))
      .filter(Boolean);
    
    const allOptions: string[] = Array.from(new Set([
      ...normalizedOptions,
      ...defaultStatuses
    ]));
    
    // Initialize columns
    if (allOptions.length > 0) {
      allOptions.forEach(option => {
        columns[option] = [];
      });
    }

    // Always ensure "Uncategorized" exists if there are rows without a status
    columns["Uncategorized"] = [];

    // Distribute root rows into columns
    rootRows.forEach(row => {
      const rawStatus = row.properties[groupByField.id];
      let status = typeof rawStatus === "string" ? rawStatus : String(rawStatus ?? "Uncategorized");
      if (!status) status = "Uncategorized";
      
      // Match case-insensitive for standard statuses to avoid duplicate columns like "New" and "new"
      const matchedOption = allOptions.find(opt => opt.toLowerCase() === status.toLowerCase());
      if (matchedOption) status = matchedOption;

      if (!columns[status]) {
        columns[status] = [];
      }
      columns[status].push(row);
    });

    // Remove Uncategorized if empty
    if (columns["Uncategorized"].length === 0) {
      delete columns["Uncategorized"];
    }

    return columns;
  };

  const groupedRows = getColumns();

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("new")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    if (s.includes("progress")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (s.includes("review")) return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    if (s.includes("reject")) return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (s.includes("complete") || s.includes("done") || s.includes("finish") || s.includes("accept")) 
      return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
    return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
  };

  const handleDragStart = (e: React.DragEvent, rowId: string) => {
    e.dataTransfer.setData("rowId", rowId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const rowId = e.dataTransfer.getData("rowId");
    if (!rowId || !groupByField) return;

    const row = rows.find((r) => r.id === rowId);
    if (row && row.properties[groupByField.id] !== targetStatus) {
      onUpdateRow(rowId, {
        ...row.properties,
        [groupByField.id]: targetStatus,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6">
      {Object.entries(groupedRows).map(([group, groupRows]) => {
        const statusStyle = getStatusColor(group);
        return (
          <div
            key={group}
            className="flex flex-col shrink-0 w-80 bg-muted/40 dark:bg-zinc-900/40 border border-border dark:border-white/5 p-4 rounded-xl"
            onDrop={(e) => handleDrop(e, group)}
            onDragOver={handleDragOver}
          >
            <div className={cn(
              "flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg border",
              statusStyle
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                statusStyle.includes("blue") && "bg-blue-500",
                statusStyle.includes("amber") && "bg-amber-500",
                statusStyle.includes("purple") && "bg-purple-500",
                statusStyle.includes("red") && "bg-red-500",
                statusStyle.includes("green") && "bg-green-500",
                statusStyle.includes("zinc") && "bg-zinc-500"
              )} />
              <h3 className="font-bold text-xs uppercase tracking-wider">{group}</h3>
              <span className="ml-auto text-[10px] font-bold opacity-60">{groupRows.length}</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px]">
            {groupRows.map((row) => {
              // Find first field with type 'file' (Image/Video) that has a value
              const mediaField = fields.find(
                (f) => f.type === "file" && row.properties[f.id],
              );
              const rawValue = mediaField
                ? row.properties[mediaField.id]
                : null;
              const mediaUrls = Array.isArray(rawValue)
                ? rawValue
                : rawValue
                  ? [rawValue]
                  : [];

              const primaryUrl = mediaUrls[0] || null;
              const isImage = primaryUrl?.match(
                /\.(jpeg|jpg|gif|png|webp|svg)/i,
              );
              const isVideo = primaryUrl?.match(/\.(mp4|webm|ogg)/i);
              
              const children = rows.filter(r => r.parent_row_id === row.id);
              const hasChildren = children.length > 0;

              return (
                <Card
                  key={row.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  className="group hover:shadow-lg active:scale-[0.98] active:rotate-1 transition-all cursor-grab bg-background overflow-hidden border-border/50"
                >
                  {(isImage || isVideo) && (
                    <div
                      className="relative h-32 w-full bg-muted/30 overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={() =>
                        mediaUrls.length > 0 &&
                        setPreviewMedia({ urls: mediaUrls, index: 0 })
                      }
                    >
                      {isVideo ? (
                        <div className="relative w-full h-full">
                          <video
                            src={primaryUrl!}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-6 h-6 fill-white text-white" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={primaryUrl!}
                          alt="Cover"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      {mediaUrls.length > 1 && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold rounded z-10">
                          +{mediaUrls.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                  <CardContent className="p-4 space-y-3">
                    {titleField && (
                      <p className="font-bold text-sm leading-tight">
                        {row.properties[titleField.id] || "Untitled"}
                      </p>
                    )}
                    <div className="space-y-3">
                      {fields
                        .filter(
                          (f) => !f.is_title_field && f.id !== groupByField?.id,
                        )
                        .map((field) => (
                          <div key={field.id} className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground/60">
                              {field.name}
                            </label>
                            <div className="min-h-[24px]">
                              <DataGridCell
                                field={field}
                                value={row.properties[field.id]}
                                workspaceId={workspaceId}
                                members={members}
                                onChange={(value) =>
                                  onUpdateRow(row.id, {
                                    ...row.properties,
                                    [field.id]: value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        ))}

                      {hasChildren && (
                        <div className="mt-4 pt-3 border-t border-dashed border-border/50">
                          <div className="flex items-center gap-1.5 mb-2">
                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              Subtasks ({children.length})
                            </span>
                          </div>
                          <div className="space-y-1.5 pl-1">
                            {children.slice(0, 3).map((child) => (
                              <div key={child.id} className="flex items-center gap-2 group/sub">
                                <CornerDownRight className="w-3 h-3 text-muted-foreground/40" />
                                <span className="text-[11px] truncate text-muted-foreground group-hover/sub:text-foreground transition-colors">
                                  {titleField ? child.properties[titleField.id] || "Untitled" : "Untitled"}
                                </span>
                              </div>
                            ))}
                            {children.length > 3 && (
                              <div className="text-[10px] text-muted-foreground/60 pl-5 font-medium">
                                + {children.length - 3} more subtasks
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => onDeleteRow(row.id)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Button
            onClick={() => {
              const newProperties: Record<string, any> = {};
              fields.forEach((field) => {
                newProperties[field.id] = "";
              });
              if (groupByField && group !== "All" && group !== "Uncategorized") {
                newProperties[groupByField.id] = group;
              }
              onAddRow({
                properties: newProperties,
                database_id: "",
                created_by: "",
              });
            }}
            variant="outline"
            className="w-full mt-4"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
        </div>
      );
    })}
    <MediaPreview
        urls={previewMedia?.urls || []}
        initialIndex={previewMedia?.index || 0}
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
      />
    </div>
  );
}
