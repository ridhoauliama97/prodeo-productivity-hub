"use client";

import * as React from "react";
import { useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Upload,
  Image as ImageIcon,
  FileIcon,
  X,
  Loader2,
  Play,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase-client";
import { fetchWorkspaceMembers } from "@/lib/api-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaPreview } from "./media-preview";
import { GoogleDrivePicker } from "./google-drive-picker";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { DatabaseField } from "@/lib/types";

interface DataGridCellProps {
  field: DatabaseField;
  value: any;
  workspaceId?: string;
  members?: any[];
  onChange: (value: any) => void;
  onUpdateField?: (updates: Partial<DatabaseField>) => void;
}

const getStatusColorClass = (value: string, fallbackColor?: string) => {
  switch (value) {
    case "New":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
    case "On Progress":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200";
    case "In Review":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200";
    case "Rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
    case "Accepted/Completed":
    case "Accepted":
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200";
    default:
      if (fallbackColor === "gray") {
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      }
      return "bg-muted text-foreground";
  }
};

export function DataGridCell({
  field,
  value,
  workspaceId,
  members,
  onChange,
  onUpdateField,
}: DataGridCellProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const options =
    (field.properties?.options as { value: string; color?: string }[]) || [];

  if (field.type === "checkbox") {
    return (
      <div className="flex items-center justify-center h-full">
        <Checkbox
          checked={!!value}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        className="h-8 border-none bg-transparent focus-visible:ring-0 px-1"
      />
    );
  }

  if (field.type === "date") {
    // Check if value is a standard YYYY-MM-DD date
    const isStandardDate = /^\d{4}-\d{2}-\d{2}$/.test(value || "");

    return (
      <Input
        type={isStandardDate || !value ? "date" : "text"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 border-none bg-transparent focus-visible:ring-0 px-1"
      />
    );
  }

  if (field.type === "select") {
    const selectedOption = options.find((opt) => opt.value === value);

    const handleCreateOption = () => {
      const newOption = { value: searchValue, color: "gray" };
      const updatedOptions = [...options, newOption];

      if (onUpdateField) {
        onUpdateField({
          properties: { ...field.properties, options: updatedOptions },
        });
      }

      onChange(searchValue);
      setOpen(false);
      setSearchValue("");
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center justify-between w-full h-8 px-1 cursor-pointer hover:bg-muted/50 rounded overflow-hidden">
            <div className="flex-1 truncate">
              {selectedOption ? (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs",
                    getStatusColorClass(
                      selectedOption.value,
                      selectedOption.color,
                    ),
                  )}
                >
                  {selectedOption.value}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  Select...
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or create..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div
                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={handleCreateOption}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create "{searchValue}"</span>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs",
                        getStatusColorClass(option.value, option.color),
                      )}
                    >
                      {option.value}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  if (field.type === "file") {
    return <MediaCell value={value} onChange={onChange} />;
  }

  if (field.type === "person") {
    return (
      <PersonCell
        value={value}
        workspaceId={workspaceId}
        membersProp={members}
        onChange={onChange}
      />
    );
  }

  // Default text input
  return <TextInput value={value} onChange={onChange} />;
}

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value ?? "");

  // Sync if external value changes
  React.useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value) {
          onChange(localValue);
        }
      }}
      className="h-8 border-none bg-transparent focus-visible:ring-0 px-1"
      placeholder="..."
    />
  );
}

function MediaCell({
  value,
  onChange,
}: {
  value: string | string[];
  onChange: (val: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewState, setPreviewState] = useState<{
    isOpen: boolean;
    index: number;
  }>({
    isOpen: false,
    index: 0,
  });
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const supabase = createClient();

  // Ensure value is always an array of strings
  const mediaUrls = Array.isArray(value) ? value : value ? [value] : [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [...mediaUrls];

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `db-media/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("database-media")
          .upload(filePath, file, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("database-media").getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...mediaUrls, ...uploadedUrls]);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error: any) {
      console.error("Error uploading:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (indexToRemove: number) => {
    const newUrls = mediaUrls.filter((_, i) => i !== indexToRemove);
    onChange(newUrls);
  };

  return (
    <div className="flex items-center gap-1.5 min-h-8 px-1 py-1 flex-wrap">
      {mediaUrls.map((url, index) => {
        const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
        const isVideo = url.match(/\.(mp4|webm|ogg)/i);
        const isGoogleDrive = url.includes("drive.google.com");

        return (
          <div key={index} className="group relative flex items-center">
            <div
              className="h-7 w-7 rounded bg-muted overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all border border-border/50 shrink-0"
              onClick={() => {
                if (isGoogleDrive) {
                  window.open(url, "_blank");
                } else {
                  setPreviewState({ isOpen: true, index });
                }
              }}
            >
              {isImage ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : isVideo ? (
                <div className="h-full w-full relative">
                  <video src={url} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="h-2 w-2 text-white fill-white" />
                  </div>
                </div>
              ) : (
                <div className="h-full w-full flex items-center justify-center relative">
                  <FileIcon className="h-3 w-3" />
                  {isGoogleDrive && (
                    <div className="absolute bottom-0 right-0 bg-zinc-900 rounded-tl p-px">
                      <svg viewBox="0 0 40 40" className="w-2.5 h-2.5">
                        <path
                          fill="#FFC107"
                          d="M17.09 7.66l-9.05 15.67h18.1l9.05-15.67z"
                        />
                        <path
                          fill="#1976D2"
                          d="M30.66 31.13h-18.1L3.51 15.46l9.05-15.67z"
                        />
                        <path
                          fill="#4CAF50"
                          d="M35.19 23.3l-9.05 15.67h-18.1l9.05-15.67z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeMedia(index);
              }}
              className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 p-0.5 bg-background border shadow-sm hover:text-destructive rounded-full transition-all z-10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        );
      })}

      {isUploading ? (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground italic">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ...
        </div>
      ) : (
        <>
          <label
            className="flex items-center justify-center h-7 w-7 rounded border border-dashed border-border hover:bg-muted/50 cursor-pointer transition-colors"
            title="Upload File"
          >
            <Plus className="h-3 w-3 text-muted-foreground" />
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              multiple
              accept="image/*,video/*,application/pdf"
            />
          </label>
          <button
            type="button"
            onClick={() => setIsDrivePickerOpen(true)}
            className="flex items-center justify-center h-7 w-7 rounded border border-dashed border-border hover:bg-muted/50 cursor-pointer transition-colors"
            title="Add from Google Drive"
          >
            <svg viewBox="0 0 40 40" className="w-4 h-4 transition-all">
              <path
                fill="#FFC107"
                d="M17.09 7.66l-9.05 15.67h18.1l9.05-15.67z"
              />
              <path
                fill="#1976D2"
                d="M30.66 31.13h-18.1L3.51 15.46l9.05-15.67z"
              />
              <path
                fill="#4CAF50"
                d="M35.19 23.3l-9.05 15.67h-18.1l9.05-15.67z"
              />
            </svg>
          </button>
        </>
      )}

      <GoogleDrivePicker
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelect={(fileUrl) => onChange([...mediaUrls, fileUrl])}
      />

      <MediaPreview
        urls={mediaUrls}
        initialIndex={previewState.index}
        isOpen={previewState.isOpen}
        onClose={() => setPreviewState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function PersonCell({
  value,
  workspaceId,
  membersProp,
  onChange,
}: {
  value: string;
  workspaceId?: string;
  membersProp?: any[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<any[]>(membersProp || []);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Update members if membersProp changes
  React.useEffect(() => {
    if (membersProp) {
      setMembers(membersProp.map((m: any) => m.user_profiles).filter(Boolean));
    }
  }, [membersProp]);

  const fetchMembers = async () => {
    if (!workspaceId || (membersProp && membersProp.length > 0)) return;
    setLoading(true);
    try {
      const data = await fetchWorkspaceMembers(workspaceId);
      setMembers(data?.map((m: any) => m.user_profiles).filter(Boolean) || []);
    } catch (err: any) {
      console.error("Error fetching members:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = members.find((m) => m.id === value);

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) fetchMembers();
      }}
    >
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 w-full h-8 px-1 cursor-pointer hover:bg-muted/50 rounded overflow-hidden">
          {value ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-5 w-5 border">
                <AvatarImage src={selectedUser?.avatar_url} />
                <AvatarFallback className="text-[10px] bg-primary/10">
                  {selectedUser?.full_name?.charAt(0) ||
                    value.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate">
                {selectedUser?.full_name || "Assignee"}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs italic px-1 flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Assign...
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search people..." />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                "No members found."
              )}
            </CommandEmpty>
            <CommandGroup heading="Workspace Members">
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={member.full_name || member.id}
                  onSelect={() => {
                    onChange(member.id === value ? "" : member.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="text-[10px] bg-primary/10">
                        {member.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {member.full_name || "Unnamed User"}
                      </span>
                    </div>
                  </div>
                  {value === member.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
