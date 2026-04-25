"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  children: React.ReactNode;
  onConfirm: () => void;
  title?: string;
  description?: string;
  variant?: "danger" | "warning";
}

export const ConfirmModal = ({
  children,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  variant = "danger",
}: ConfirmModalProps) => {
  const handleConfirm = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    onConfirm();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-zinc-950 border-white/10 shadow-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${variant === "danger" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-white text-xl font-bold">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-zinc-400 pt-2 text-base leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel className="bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={`${variant === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"} text-white border-none shadow-lg shadow-red-900/20`}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
