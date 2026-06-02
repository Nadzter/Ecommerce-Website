import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { Dumbbell } from "lucide-react";
import type { Studio } from "@/prisma/generated/client";

import { MobileSidebar } from "./mobile-sidebar";

interface TopBarProps {
  studio: Studio;
}

/**
 * Sticky top bar showing the studio logo + name on the left and the Clerk
 * user button on the right. On mobile it also exposes the slide-over nav.
 */
export function TopBar({ studio }: TopBarProps): JSX.Element {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
      <MobileSidebar studioName={studio.name} />
      <div className="flex items-center gap-3">
        {studio.logoUrl ? (
          <Image
            src={studio.logoUrl}
            alt={`${studio.name} logo`}
            width={32}
            height={32}
            className="h-8 w-8 rounded-md object-cover"
          />
        ) : (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md text-primary-foreground"
            style={{ backgroundColor: studio.primaryColor }}
          >
            <Dumbbell className="h-4 w-4" aria-hidden />
          </span>
        )}
        <div className="leading-tight">
          <p className="text-sm font-semibold">{studio.name}</p>
          <p className="text-xs text-muted-foreground">
            {studio.slug}.fitstudio.app
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{ elements: { avatarBox: "h-9 w-9" } }}
        />
      </div>
    </header>
  );
}
