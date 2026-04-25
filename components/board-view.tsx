"use client";

import { useState } from "react";
import { Plus, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DatabaseField, DatabaseRow } from "@/lib/types";
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
    if (!groupByField) return { "All": rows };
    
    const columns: Record<string, DatabaseRow[]> = {};
    
    // Default statuses for a standard Kanban flow if field name contains "status"
    const isStatusField = groupByField.name.toLowerCase().includes("status");
    const defaultStatuses = isStatusField 
      ? ["New", "On Progress", "In Review", "Rejected", "Completed"] 
      : [];

    // Combine options from field and defaults (avoiding duplicates)
    const allOptions = Array.from(new Set([
      ...(groupByField.options || []),
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

    // Distribute rows into columns
    rows.forEach(row => {
      let status = row.properties[groupByField.id] || "Uncategorized";
      
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
    if (s.includes("new")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (s.includes("progress")) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    if (s.includes("review")) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    if (s.includes("reject")) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (s.includes("complete") || s.includes("done") || s.includes("finish") || s.includes("accept")) 
      return "bg-green-500/10 text-green-500 border-green-500/20";
    return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
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
            className="flex flex-col shrink-0 w-80 bg-zinc-900/40 border border-white/5 p-4 rounded-xl"
            onDrop={(e) => handleDrop(e, group)}
            onDragOver={handleDragOver}
          >
            <div className={`flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg border ${statusStyle.split(' ').slice(0, 2).join(' ')} ${statusStyle.split(' ')[2]}`}>
              <div className={`w-2 h-2 rounded-full ${statusStyle.split(' ')[1].replace('text-', 'bg-')}`} />
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

              return (
                <Card
                  key={row.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, row.id)}
                  className="group hover:shadow-lg active:scale-[0.98] active:rotate-1 transition-all cursor-grab bg-background overflow-hidden border-border/50"
                >
                  <div
                    className="relative h-32 w-full bg-muted/30 overflow-hidden flex items-center justify-center cursor-pointer"
                    onClick={() =>
                      mediaUrls.length > 0 &&
                      setPreviewMedia({ urls: mediaUrls, index: 0 })
                    }
                  >
                    {primaryUrl ? (
                      <>
                        {isVideo ? (
                          <div className="relative w-full h-full">
                            <video
                              src={primaryUrl}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 fill-white text-white" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={primaryUrl}
                            alt="Cover"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        {mediaUrls.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold rounded z-10">
                            +{mediaUrls.length - 1}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
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
