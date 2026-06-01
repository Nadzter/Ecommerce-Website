"use client";

import * as React from "react";
import Link from "next/link";
import { Dumbbell, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";

interface MobileSidebarProps {
  studioName: string;
}

/**
 * Slide-over sidebar surfaced via the hamburger menu on screens smaller than
 * the `lg` Tailwind breakpoint.
 */
export function MobileSidebar({
  studioName,
}: MobileSidebarProps): JSX.Element {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle asChild>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-base font-semibold"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Dumbbell className="h-4 w-4" aria-hidden />
              </span>
              <span className="truncate">{studioName}</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="p-4">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
