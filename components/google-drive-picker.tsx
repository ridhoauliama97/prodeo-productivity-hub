"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, File, ChevronRight, Loader2, ArrowLeft, Image as ImageIcon, Video, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
  thumbnailLink?: string;
}

interface GoogleDrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fileUrl: string) => void;
}

export function GoogleDrivePicker({ isOpen, onClose, onSelect }: GoogleDrivePickerProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [files, setFiles] = React.useState<DriveFile[]>([]);
  
  // Navigation state
  const [history, setHistory] = React.useState<{ id: string; name: string }[]>([{ id: 'root', name: 'My Drive' }]);
  const currentFolder = history[history.length - 1];

  const fetchFiles = async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No active session");
      }

      const res = await fetch(`/api/google/drive?folderId=${folderId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.expired) {
          throw new Error("Google session expired. Please disconnect and reconnect your Google Account in Profile.");
        }
        throw new Error(data.error || "Failed to fetch from Google Drive");
      }

      setFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      // Reset to root when opened
      setHistory([{ id: 'root', name: 'My Drive' }]);
      fetchFiles('root');
    }
  }, [isOpen]);

  const handleFolderClick = (folder: DriveFile) => {
    setHistory(prev => [...prev, { id: folder.id, name: folder.name }]);
    fetchFiles(folder.id);
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      fetchFiles(newHistory[newHistory.length - 1].id);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === history.length - 1) return;
    const newHistory = history.slice(0, index + 1);
    setHistory(newHistory);
    fetchFiles(newHistory[newHistory.length - 1].id);
  };

  const handleFileSelect = (file: DriveFile) => {
    onSelect(file.webViewLink);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-950 border-white/10">
        <DialogHeader className="p-4 sm:p-6 border-b border-white/10 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-white">
            <svg viewBox="0 0 40 40" className="w-5 h-5">
              <path fill="#FFC107" d="M17.09 7.66l-9.05 15.67h18.1l9.05-15.67z" />
              <path fill="#1976D2" d="M30.66 31.13h-18.1L3.51 15.46l9.05-15.67z" />
              <path fill="#4CAF50" d="M35.19 23.3l-9.05 15.67h-18.1l9.05-15.67z" />
            </svg>
            Select from Google Drive
          </DialogTitle>
        </DialogHeader>

        {/* Navigation Bar */}
        <div className="flex items-center gap-2 p-3 border-b border-white/5 bg-zinc-900/30 shrink-0 overflow-x-auto hide-scrollbar">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-400 hover:text-white shrink-0"
            onClick={handleBack}
            disabled={history.length <= 1 || loading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center text-sm font-medium text-zinc-300">
            {history.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-zinc-600 shrink-0" />}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={cn(
                    "hover:text-white hover:underline transition-colors truncate max-w-[150px]",
                    index === history.length - 1 ? "text-white" : "text-zinc-500"
                  )}
                  disabled={loading}
                >
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <p className="text-red-400 mb-4 max-w-md">{error}</p>
                <Button onClick={() => fetchFiles(currentFolder.id)} variant="outline" className="border-white/10 bg-zinc-900 hover:bg-zinc-800 text-white">
                  Retry
                </Button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-zinc-500">
                <Folder className="h-12 w-12 mb-4 opacity-20" />
                <p>This folder is empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((file) => {
                  const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                  
                  return (
                    <button
                      key={file.id}
                      onClick={() => isFolder ? handleFolderClick(file) : handleFileSelect(file)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-center group"
                    >
                      <div className="w-16 h-16 rounded bg-zinc-900/80 border border-white/5 flex items-center justify-center overflow-hidden relative shadow-sm group-hover:shadow-md transition-all">
                        {isFolder ? (
                          <Folder className="h-8 w-8 text-blue-400/80 group-hover:text-blue-400 transition-colors" />
                        ) : file.thumbnailLink ? (
                          <img src={file.thumbnailLink} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <img src={file.iconLink} alt="" className="h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-zinc-300 group-hover:text-white w-full truncate px-1">
                        {file.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
