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
  const groupedRows = groupByField
    ? Array.from(
        new Map(
          rows.map((row) => [
            row.properties[groupByField.id] || "Uncategorized",
            row,
          ]),
        ).entries(),
      ).reduce(
        (acc, [group, row]) => {
          if (!acc[group as string]) acc[group as string] = [];
          acc[group as string].push(row);
          return acc;
        },
        {} as Record<string, DatabaseRow[]>,
      )
    : { All: rows };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Object.entries(groupedRows).map(([group, groupRows]) => (
        <div
          key={group}
          className="flex flex-col shrink-0 w-80 bg-muted p-4 rounded-lg"
        >
          <h3 className="font-semibold mb-4">{group}</h3>
          <div className="space-y-3 flex-1 overflow-y-auto">
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
                  className="group hover:shadow-lg transition-all cursor-move bg-background overflow-hidden border-border/50"
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
                newProperties[field.id] = group !== "All" ? group : "";
              });
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
      ))}
      <MediaPreview
        urls={previewMedia?.urls || []}
        initialIndex={previewMedia?.index || 0}
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
      />
    </div>
  );
}
