"use client";

import { useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Trash2, Play } from "lucide-react";
import { MediaPreview } from "./media-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DatabaseField, DatabaseRow } from "@/lib/types";

interface CalendarViewProps {
  fields: DatabaseField[];
  rows: DatabaseRow[];
  dateField?: DatabaseField;
  onAddRow: (
    row: Omit<DatabaseRow, "id" | "created_at" | "updated_at">,
  ) => void;
  onDeleteRow: (id: string) => void;
}

export function CalendarView({
  fields,
  rows,
  dateField,
  onAddRow,
  onDeleteRow,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [previewMedia, setPreviewMedia] = useState<{
    urls: string[];
    index: number;
  } | null>(null);
  const titleField = fields.find((f) => f.is_title_field);

  const daysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const eventsPerDay = useMemo(() => {
    const events: Record<number, DatabaseRow[]> = {};

    rows.forEach((row) => {
      if (!dateField) return;

      const dateStr = row.properties[dateField.id];
      if (!dateStr) return;

      try {
        const eventDate = new Date(dateStr);
        if (
          eventDate.getMonth() === currentDate.getMonth() &&
          eventDate.getFullYear() === currentDate.getFullYear()
        ) {
          const day = eventDate.getDate();
          if (!events[day]) events[day] = [];
          events[day].push(row);
        }
      } catch {
        // Invalid date
      }
    });

    return events;
  }, [rows, dateField, currentDate]);

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );

  const days = [];
  const totalCells = firstDayOfMonth(currentDate) + daysInMonth(currentDate);

  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - firstDayOfMonth(currentDate) + 1;
    const isCurrentMonth =
      dayNumber > 0 && dayNumber <= daysInMonth(currentDate);
    days.push(isCurrentMonth ? dayNumber : null);
  }

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{monthName}</h2>
        <div className="flex gap-2">
          <Button onClick={prevMonth} size="sm" variant="outline">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button onClick={nextMonth} size="sm" variant="outline">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center font-semibold text-sm border-r last:border-r-0 bg-muted"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0 bg-background">
          {days.map((day, idx) => (
            <div
              key={idx}
              className="min-h-32 border-r border-b last:border-r-0 p-2 bg-background hover:bg-muted/50 transition-colors"
            >
              {day && (
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{day}</div>
                  <div className="space-y-1">
                    {eventsPerDay[day]?.slice(0, 3).map((event) => {
                      // Find first field with type 'file'
                      const mediaField = fields.find(
                        (f) => f.type === "file" && event.properties[f.id],
                      );
                      const rawValue = mediaField
                        ? event.properties[mediaField.id]
                        : null;
                      const mediaUrls = Array.isArray(rawValue)
                        ? rawValue
                        : rawValue
                          ? [rawValue]
                          : [];
                      const primaryUrl = mediaUrls[0] || null;
                      const isImage = primaryUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
                      const isVideo = primaryUrl?.match(/\.(mp4|webm|ogg)/i);

                      return (
                        <div
                          key={event.id}
                          className="group relative text-[10px] bg-card border border-border/50 hover:border-primary/50 p-1.5 rounded-md shadow-sm transition-all cursor-pointer flex flex-col gap-1.5"
                          onClick={() =>
                            mediaUrls.length > 0 &&
                            setPreviewMedia({ urls: mediaUrls, index: 0 })
                          }
                        >
                          {(isImage || isVideo) && (
                            <div className="relative h-12 w-full bg-muted rounded overflow-hidden">
                              {isVideo ? (
                                <div className="w-full h-full relative">
                                  <video
                                    src={primaryUrl}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Play className="w-3 h-3 fill-white text-white" />
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={primaryUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                              {mediaUrls.length > 1 && (
                                <div className="absolute bottom-1 right-1 px-1 bg-black/60 text-[8px] text-white font-bold rounded">
                                  +{mediaUrls.length - 1}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold truncate text-foreground/90">
                              {titleField
                                ? event.properties[titleField.id]
                                : "Untitled"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteRow(event.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-opacity"
                            >
                              <Trash2 className="w-2.5 h-2.5 text-red-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {eventsPerDay[day] && eventsPerDay[day].length > 3 && (
                      <p className="text-[9px] text-muted-foreground font-medium pl-1">
                        +{eventsPerDay[day].length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <MediaPreview
        urls={previewMedia?.urls || []}
        initialIndex={previewMedia?.index || 0}
        isOpen={!!previewMedia}
        onClose={() => setPreviewMedia(null)}
      />

      {dateField && (
        <Button
          onClick={() => {
            const newProperties: Record<string, any> = {};
            fields.forEach((field) => {
              if (field.id === dateField.id) {
                newProperties[field.id] = new Date()
                  .toISOString()
                  .split("T")[0];
              } else {
                newProperties[field.id] = "";
              }
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
          Add Event
        </Button>
      )}
    </div>
  );
}
