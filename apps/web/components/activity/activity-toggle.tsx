"use client";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useActivityStore } from "@/store/activity-store";

export function ActivityToggle() {
  const { toggle, entries } = useActivityStore();

  return (
    <Button variant="ghost" size="sm" className="relative" onClick={toggle} aria-label="Toggle activity drawer">
      <History className="h-4 w-4" />
      <span className="ml-2 text-sm font-medium">Activity</span>
      {entries.length ? (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
          {entries.length}
        </span>
      ) : null}
    </Button>
  );
}
