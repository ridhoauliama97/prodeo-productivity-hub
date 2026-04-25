"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Type,
  Database,
  Info,
  ChevronRight,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  command: (editor: any) => void;
}

const commands: CommandItem[] = [
  {
    title: "Text",
    description: "Just start writing with plain text.",
    icon: <Type className="w-4 h-4" />,
    category: "Basic blocks",
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Big section heading.",
    icon: <Heading1 className="w-4 h-4" />,
    category: "Basic blocks",
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading.",
    icon: <Heading2 className="w-4 h-4" />,
    category: "Basic blocks",
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading.",
    icon: <Heading3 className="w-4 h-4" />,
    category: "Basic blocks",
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Create a simple bulleted list.",
    icon: <List className="w-4 h-4" />,
    category: "Basic blocks",
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering.",
    icon: <ListOrdered className="w-4 h-4" />,
    category: "Basic blocks",
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Quote",
    description: "Capture a quotation.",
    icon: <Quote className="w-4 h-4" />,
    category: "Basic blocks",
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Capture a code snippet.",
    icon: <Code className="w-4 h-4" />,
    category: "Basic blocks",
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Callout",
    description: "Make writing stand out.",
    icon: <Info className="w-4 h-4" />,
    category: "Basic blocks",
    command: (editor) => {
      // Simple implementation of callout using default blockquote for now,
      // to be enhanced with dedicated custom extension later if needed.
      editor.chain().focus().toggleBlockquote().run();
    },
  },
];

export function SlashCommandMenu({
  editor,
  position,
  onClose,
}: {
  editor: any;
  position: { top: number; left: number };
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + commands.length) % commands.length,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeCommand(selectedIndex);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, editor, onClose]);

  const executeCommand = (index: number) => {
    const { from } = editor.state.selection;
    editor
      .chain()
      .focus()
      .deleteRange({ from: from - 1, to: from })
      .run();
    commands[index].command(editor);
    onClose();
  };

  // Group commands by category
  const categories = commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      ref={menuRef}
      style={{ top: position.top, left: position.left }}
      className="fixed z-100 w-[300px] max-h-[450px] overflow-y-auto bg-popover border border-border shadow-2xl rounded-xl p-1.5 ring-1 ring-black/5"
    >
      {Object.entries(categories).map(([category, items]) => (
        <div key={category} className="mb-2 last:mb-0">
          <div className="px-3 py-2 text-[11px] uppercase font-bold text-muted-foreground/70 tracking-wider">
            {category}
          </div>
          {items.map((cmd) => {
            const index = commands.indexOf(cmd);
            const isSelected = index === selectedIndex;
            return (
              <div
                key={cmd.title}
                onClick={() => executeCommand(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "flex items-center gap-x-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-75",
                  isSelected
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50",
                )}
              >
                <div className="w-11 h-11 bg-background border border-border rounded-lg flex items-center justify-center shadow-sm">
                  {cmd.icon}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium leading-none mb-1">
                    {cmd.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1">
                    {cmd.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
}
