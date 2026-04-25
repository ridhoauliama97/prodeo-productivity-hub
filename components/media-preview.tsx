"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileIcon, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MediaPreviewProps {
  urls: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaPreview({
  urls,
  initialIndex = 0,
  isOpen,
  onClose,
}: MediaPreviewProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Reset current index when opened
  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const currentUrl = urls[currentIndex] || "";
  const isImage = currentUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
  const isVideo = currentUrl.match(/\.(mp4|webm|ogg)/i);
  const type = isImage ? "image" : isVideo ? "video" : "file";

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, urls.length, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  React.useEffect(() => {
    if (isOpen && type === "video" && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [isOpen, type, currentIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
          onClick={onClose}
        >
          {/* Top Bar / Close */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-50">
            <div className="text-white/60 text-sm font-medium">
              {currentIndex + 1} / {urls.length}
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Arrows */}
          {urls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-6 z-50 p-3 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all backdrop-blur-sm group"
              >
                <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-6 z-50 p-3 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all backdrop-blur-sm group"
              >
                <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}

          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {type === "image" ? (
              <img
                src={currentUrl}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                alt="Fullscreen Preview"
              />
            ) : type === "video" ? (
              <video
                ref={videoRef}
                src={currentUrl}
                controls
                className="max-w-full max-h-[85vh] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                autoPlay
              />
            ) : (
              <div className="bg-white/5 backdrop-blur-md p-16 rounded-2xl flex flex-col items-center gap-6 border border-white/10 shadow-2xl">
                <div className="p-6 bg-primary/10 rounded-full">
                  <FileIcon className="w-20 h-20 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg max-w-xs truncate">
                    {currentUrl.split("/").pop()}
                  </p>
                  <p className="text-white/40 text-sm mt-1">Generic Document</p>
                </div>
                <Button size="lg" className="px-10 rounded-full" asChild>
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download File
                  </a>
                </Button>
              </div>
            )}
          </motion.div>

          {/* Thumbnails Strip */}
          {urls.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/5 overflow-x-auto max-w-[90vw]">
              {urls.map((u, i) => (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  className={cn(
                    "w-12 h-12 rounded-lg cursor-pointer transition-all border-2 overflow-hidden shrink-0",
                    i === currentIndex
                      ? "border-primary scale-110"
                      : "border-transparent opacity-40 hover:opacity-100",
                  )}
                >
                  {u.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                    <img
                      src={u}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
