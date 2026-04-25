import * as React from "react";
import { IconPicker } from "./icon-picker";
import {
  SmilePlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Page } from "@/lib/types";

interface PageHeaderProps {
  page: Page;
  onUpdate: (updates: Partial<Page>) => void;
  breadcrumbs: { title: string; id: string }[];
  onNavigate: (id: string) => void;
}

export function PageHeader({
  page,
  onUpdate,
  breadcrumbs,
  onNavigate,
}: PageHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [title, setTitle] = React.useState(page.title);

  React.useEffect(() => {
    setTitle(page.title);
  }, [page.title]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title !== page.title) {
      onUpdate({ title });
    }
  };

  const onIconSelect = (icon: string) => {
    onUpdate({ icon });
  };

  const onRemoveIcon = () => {
    onUpdate({ icon: undefined });
  };

  return (
    <div className="group/header w-full pt-6">
      <div className="px-4">
        {/* Icon + Title section — left aligned */}
        <div className="flex flex-col gap-1.5">
          {/* Icon row */}
          {page.icon ? (
            <div className="flex items-center gap-x-2 group/icon-container w-fit">
              <IconPicker onChange={onIconSelect}>
                <p className="text-[28px] hover:bg-muted/50 transition rounded-md cursor-pointer leading-none">
                  {page.icon}
                </p>
              </IconPicker>
              <Button
                onClick={onRemoveIcon}
                className="opacity-0 group-hover/icon-container:opacity-100 transition text-muted-foreground text-xs h-6"
                variant="outline"
                size="sm"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="opacity-0 group-hover/header:opacity-100 transition h-7">
              <IconPicker onChange={onIconSelect}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs h-7 px-2"
                >
                  <SmilePlus className="h-4 w-4 mr-1.5" />
                  Add icon
                </Button>
              </IconPicker>
            </div>
          )}

          {/* Page Title — left aligned, directly below icon */}
          <div className="pb-4 group/title">
            {isEditingTitle ? (
              <textarea
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleTitleSubmit();
                  }
                }}
                className="text-3xl font-bold bg-transparent border-none outline-none w-full resize-none wrap-break-word min-h-[1.2em] leading-tight tracking-tight text-foreground"
                rows={1}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-3xl font-bold cursor-text hover:bg-muted/50 rounded-md px-1 -ml-1 transition-all wrap-break-word leading-tight tracking-tight text-foreground"
              >
                {page.title || "Untitled"}
              </h1>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
