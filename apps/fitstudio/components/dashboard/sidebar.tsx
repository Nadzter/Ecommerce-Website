import Link from "next/link";
import { Dumbbell } from "lucide-react";

import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  studioName: string;
}

/**
 * Fixed-width sidebar shown on desktops. The mobile equivalent is rendered
 * inside the `TopBar` component using shadcn's `Sheet` primitive.
 */
export function Sidebar({ studioName }: SidebarProps): JSX.Element {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-base font-semibold"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Dumbbell className="h-4 w-4" aria-hidden />
          </span>
          <span className="truncate">{studioName}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <SidebarNav />
      </div>
      <div className="border-t p-4 text-xs text-muted-foreground">
        FitStudio Cloud · v0.1.0
      </div>
    </aside>
  );
}
