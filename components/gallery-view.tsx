"use client";

import { Plus, Trash2, Play, ChevronDown, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DatabaseField, DatabaseRow } from "@/lib/types";
import { DataGridCell } from "./data-grid-cell";
import { MediaPreview } from "./media-preview";
import { useState } from "react";

interface GalleryViewProps {
  fields: DatabaseField[];
  rows: DatabaseRow[];
  onAddRow: (
    row: Omit<DatabaseRow, "id" | "created_at" | "updated_at">,
  ) => void;
  onDeleteRow: (id: string) => void;
  workspaceId: string;
  members?: any[];
}

export function GalleryView({
  fields,
  rows,
  onAddRow,
  onDeleteRow,
  workspaceId,
  members,
}: GalleryViewProps) {
  const titleField = fields.find((f) => f.is_title_field);
  const [previewMedia, setPreviewMedia] = useState<{
    urls: string[];
    index: number;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.filter(r => !r.parent_row_id).map((row) => {
          const children = rows.filter(r => r.parent_row_id === row.id);
          const hasChildren = children.length > 0;
          // Find first field with type 'file' (Image/Video) that has a value
          const mediaField = fields.find(
            (f) => f.type === "file" && row.properties[f.id],
          );
          const rawValue = mediaField ? row.properties[mediaField.id] : null;
          const mediaUrls = Array.isArray(rawValue)
            ? rawValue
            : rawValue
              ? [rawValue]
              : [];

          const primaryUrl = mediaUrls[0] || null;
          const isImage = primaryUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
          const isVideo = primaryUrl?.match(/\.(mp4|webm|ogg)/i);

          return (
            <Card
              key={row.id}
              className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-border/40 bg-card/40 backdrop-blur-md shadow-lg flex flex-col"
            >
              {(isImage || isVideo) && (
                <div
                  className="relative h-48 w-full bg-muted/30 overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() =>
                    mediaUrls.length > 0 &&
                    setPreviewMedia({ urls: mediaUrls, index: 0 })
                  }
                >
                  {isVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        src={primaryUrl!}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-500">
                        <div className="p-4 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-500">
                          <Play className="w-8 h-8 fill-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={primaryUrl!}
                      alt="Cover"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                  {mediaUrls.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-md z-10">
                      +{mediaUrls.length - 1} more
                    </div>
                  )}
                </div>
              )}
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  {titleField && (
                    <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors tracking-tight">
                      {row.properties[titleField.id] || "Untitled"}
                    </h3>
                  )}
                  <div className="space-y-4 pt-4 border-t border-border/20">
                    {fields
                      .filter((f) => !f.is_title_field)
                      .map((field) => (
                        <div key={field.id} className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">
                            {field.name}
                          </label>
                          <div className="min-h-[32px] rounded-lg hover:bg-muted/40 transition-all px-1 -mx-1">
                            <DataGridCell
                              field={field}
                              value={row.properties[field.id]}
                              workspaceId={workspaceId}
                              members={members}
                              onChange={() => {}} // Read-only for now in gallery view
                            />
                          </div>
                        </div>
                      ))}
                    
                    {hasChildren && (
                      <div className="mt-4 pt-4 border-t border-dashed border-border/20">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ChevronDown className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Subtasks ({children.length})
                          </span>
                        </div>
                        <div className="space-y-2 pl-1">
                          {children.slice(0, 3).map((child) => (
                            <div key={child.id} className="flex items-center gap-2">
                              <CornerDownRight className="w-3 h-3 text-muted-foreground/40" />
                              <span className="text-xs truncate text-muted-foreground">
                                {titleField ? child.properties[titleField.id] || "Untitled" : "Untitled"}
                              </span>
                            </div>
                          ))}
                          {children.length > 3 && (
                            <div className="text-[10px] text-muted-foreground/50 pl-5">
                              + {children.length - 3} more subtasks
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end pt-4 border-t border-border/10">
                    <button
                      onClick={() => onDeleteRow(row.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive rounded-lg transition-all text-muted-foreground/60"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <MediaPreview
        urls={previewMedia?.urls || []}
        initialIndex={previewMedia?.index || 0}
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
      />

      <Button
        onClick={() => {
          const newProperties: Record<string, any> = {};
          fields.forEach((field) => {
            newProperties[field.id] = "";
          });
          onAddRow({
            properties: newProperties,
            database_id: "",
            created_by: "",
          });
        }}
        variant="outline"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}
