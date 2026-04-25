"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  List,
  Mail,
  Link as LinkIcon,
  Phone,
  FileText,
  Save,
  RotateCcw,
  Users,
} from "lucide-react";
import { DataGridCell } from "./data-grid-cell";
import type { DatabaseField, DatabaseRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createNotificationApi } from "@/lib/api-client";
import { toast } from "sonner";

interface DatabaseTableProps {
  fields: DatabaseField[];
  rows: DatabaseRow[];
  onAddField: (field: Omit<DatabaseField, "id" | "created_at">) => void;
  onAddRow: (
    row: Omit<DatabaseRow, "id" | "created_at" | "updated_at">,
  ) => void;
  onUpdateRow: (id: string, properties: Record<string, any>) => void;
  onDeleteRow: (id: string) => void;
  onDeleteField: (id: string) => void;
  onUpdateField?: (id: string, updates: Partial<DatabaseField>) => void;
  onSave?: (updatedRows: DatabaseRow[]) => void;
  workspaceId: string;
  members?: any[];
}

export function DatabaseTable({
  fields,
  rows,
  onAddField,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  onDeleteField,
  onUpdateField,
  onSave,
  workspaceId,
  members,
}: DatabaseTableProps) {
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [localRows, setLocalRows] = useState<DatabaseRow[]>(rows);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalRows(rows);
    setIsDirty(false);
  }, [rows]);

  const isRowCompleted = (props: Record<string, any>) => {
    const completedStatusValues = [
      "completed",
      "accepted",
      "finished",
      "done",
      "accepted/completed",
    ];
    return fields.some((f) => {
      if (f.type !== "select") return false;
      const val = String(props[f.id] || "").toLowerCase();
      return completedStatusValues.includes(val);
    });
  };

  const handleUpdateLocalRow = async (
    rowId: string,
    properties: Record<string, any>,
  ) => {
    const oldRow = localRows.find((r) => r.id === rowId);
    if (!oldRow) return;

    let updatedProperties = { ...properties };
    const oldProperties = oldRow.properties;
    const oldCompleted = isRowCompleted(oldProperties);
    const newCompleted = isRowCompleted(updatedProperties);

    // Auto-fill Finished At and trigger column creation if needed
    if (newCompleted) {
      let hasFinishedAt = false;
      let hasCommentar = false;

      // Find specific fields by name
      let finishedAtField = fields.find((f) => 
        f.name.toLowerCase() === "finished at" || 
        f.name.toLowerCase() === "finished_at" ||
        f.name.toLowerCase() === "completed at"
      );
      let commentarField = fields.find((f) => 
        f.name.toLowerCase() === "commentar" || 
        f.name.toLowerCase() === "comments" ||
        f.name.toLowerCase() === "comment"
      );

      if (finishedAtField) {
        const now = new Date();
        const formattedDate = now.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const formattedTime = now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).replace(".", ":");
        
        const timestamp = `${formattedDate}, ${formattedTime}`;
        
        // Update if it's a transition to completed OR the field is empty
        if (!oldCompleted || !updatedProperties[finishedAtField.id]) {
          updatedProperties[finishedAtField.id] = timestamp;
          toast.success("Finished At updated automatically");
          
          if (finishedAtField.type === "date") {
            onUpdateField?.(finishedAtField.id, { type: "text" });
          }
        }
        hasFinishedAt = true;
      }

      if (commentarField) {
        hasCommentar = true;
      }

      // If either is missing, trigger onAddField to create them
      if (!hasFinishedAt) {
        toast.info("Creating 'Finished At' column...");
        onAddField({
          name: "Finished At",
          type: "text",
          properties: {},
          order_index: fields.length,
          is_title_field: false,
          database_id: "",
        });
      }
      
      if (!hasCommentar) {
        toast.info("Creating 'Commentar' column...");
        onAddField({
          name: "Commentar",
          type: "text",
          properties: {},
          order_index: fields.length + 1,
          is_title_field: false,
          database_id: "",
        });
      }
    }

    // Comment Notification
    const commentarField = fields.find((f) => f.name.toLowerCase() === "commentar" || f.name.toLowerCase() === "comments");
    if (newCompleted && commentarField && oldRow.properties[commentarField.id] !== updatedProperties[commentarField.id] && updatedProperties[commentarField.id]) {
      // Find assignee
      const personField = fields.find((f) => f.type === "person");
      if (personField && updatedProperties[personField.id]) {
        const userId = updatedProperties[personField.id];
        try {
          const titleField = fields.find(f => f.is_title_field) || fields[0];
          const taskName = titleField ? updatedProperties[titleField.id] : "Task";
          await createNotificationApi(userId, `New comment on ${taskName}`, updatedProperties[commentarField.id], `/workspace/${workspaceId}/database/${fields[0]?.database_id || ''}`);
          toast.success("Assignee notified of comment");
        } catch (e) {
          console.error("Failed to notify:", e);
        }
      }
    }

    setLocalRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, properties: updatedProperties } : r)),
    );
    setIsDirty(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(localRows);
      setIsDirty(false);
    }
  };

  const handleReset = () => {
    setLocalRows(rows);
    setIsDirty(false);
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;

    onAddField({
      name: newFieldName,
      type: newFieldType,
      properties: {},
      order_index: fields.length,
      is_title_field: fields.length === 0,
      database_id: "", // Will be set by parent
    });

    setNewFieldName("");
    setNewFieldType("text");
    setShowFieldForm(false);
  };

  const handleAddRow = () => {
    const newProperties: Record<string, any> = {};
    fields.forEach((field) => {
      newProperties[field.id] = "";
    });

    onAddRow({
      properties: newProperties,
      database_id: "", // Will be set by parent
      created_by: "",
    });
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "number":
        return <Hash className="w-3.5 h-3.5" />;
      case "date":
        return <Calendar className="w-3.5 h-3.5" />;
      case "checkbox":
        return <CheckSquare className="w-3.5 h-3.5" />;
      case "select":
        return <List className="w-3.5 h-3.5" />;
      case "email":
        return <Mail className="w-3.5 h-3.5" />;
      case "url":
        return <LinkIcon className="w-3.5 h-3.5" />;
      case "phone":
        return <Phone className="w-3.5 h-3.5" />;
      case "file":
        return <FileText className="w-3.5 h-3.5" />;
      case "person":
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <Type className="w-3.5 h-3.5" />;
    }
  };

  const fieldTypes = [
    "text",
    "number",
    "date",
    "checkbox",
    "select",
    "person",
    "email",
    "url",
    "phone",
    "file",
  ];

  // Logic to separate completed rows for rendering
  const activeRows = localRows.filter((r) => !isRowCompleted(r.properties));
  const completedRows = localRows.filter((r) => isRowCompleted(r.properties));
  const renderedRows = [...activeRows, ...completedRows];

  return (
    <div className="space-y-0">
      {/* Sticky Save/Discard Bar */}
      {isDirty && (
        <div className="sticky top-0 z-20 flex items-center gap-2 px-4 py-2.5 mb-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-1 text-xs font-medium text-blue-700 dark:text-blue-300">
            You have unsaved changes
          </div>
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-blue-700 dark:text-blue-300 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900"
          >
            <RotateCcw className="w-3 h-3" />
            Discard
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-3 h-3" />
            Save
          </Button>
        </div>
      )}

      {/* Fields management */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
        {fields.map((field) => (
          <div
            key={field.id}
            className="group/field flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 hover:bg-muted border rounded-md whitespace-nowrap transition-colors"
          >
            <span className="text-muted-foreground">{getFieldIcon(field.type)}</span>
            <span className="text-xs font-medium text-foreground">{field.name}</span>
            <button
              onClick={() => onDeleteField(field.id)}
              className="ml-0.5 p-0.5 opacity-0 group-hover/field:opacity-100 hover:bg-destructive/10 rounded transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </button>
          </div>
        ))}

        {!showFieldForm ? (
          <Button
            onClick={() => setShowFieldForm(true)}
            size="sm"
            variant="ghost"
            className="h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs">New field</span>
          </Button>
        ) : (
          <div className="flex gap-1.5 items-center bg-background border rounded-md p-1.5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <input
              autoFocus
              type="text"
              placeholder="Field name"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddField(); }}
              className="px-2 py-1 text-xs border rounded-md bg-background w-28 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value)}
              className="px-2 py-1 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {fieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <Button onClick={handleAddField} size="sm" className="h-7 text-xs px-3">
              Add
            </Button>
            <Button
              onClick={() => {
                setShowFieldForm(false);
                setNewFieldName("");
                setNewFieldType("text");
              }}
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Table view */}
      {fields.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  {fields.map((field) => (
                    <th
                      key={field.id}
                      className="px-4 py-2.5 text-left font-medium text-xs border-r last:border-r-0"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                        {getFieldIcon(field.type)}
                        <span className="text-foreground font-semibold tracking-tight">{field.name}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {renderedRows.map((row) => {
                  const isCompleted = isRowCompleted(row.properties);
                  return (
                  <tr key={row.id} className={cn("hover:bg-muted/30 group transition-colors", isCompleted && "bg-muted/50")}>
                    {fields.map((field) => (
                      <td
                        key={field.id}
                        className={cn("px-4 py-1.5 border-r last:border-r-0 min-w-[200px]", isCompleted && "opacity-60")}
                      >
                        <div className={cn(isCompleted && field.type !== "select" && field.type !== "person" && field.type !== "file" && field.type !== "checkbox" && "line-through text-muted-foreground w-full h-full")}>
                          <DataGridCell
                            field={field}
                            value={row.properties[field.id]}
                            workspaceId={workspaceId}
                            members={members}
                            onChange={(val) =>
                              handleUpdateLocalRow(row.id, {
                                ...row.properties,
                                [field.id]: val,
                              })
                            }
                            onUpdateField={(updates) =>
                              onUpdateField?.(field.id, updates)
                            }
                          />
                        </div>
                      </td>
                    ))}
                    <td className="px-2 py-1.5 w-10 text-center">
                      <button
                        onClick={() => onDeleteRow(row.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* Add row - inside table container for seamless look */}
          <button
            onClick={handleAddRow}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New row
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-foreground">No fields yet</p>
          <p className="text-xs mt-1">Add a field above to start building your database.</p>
        </div>
      )}
    </div>
  );
}
