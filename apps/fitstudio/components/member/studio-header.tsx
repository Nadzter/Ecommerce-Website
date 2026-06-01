import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Dumbbell } from "lucide-react";
import type { Studio } from "@prisma/client";

import { Button } from "@/components/ui/button";

interface StudioHeaderProps {
  studio: Studio;
}

export function StudioHeader({ studio }: StudioHeaderProps): JSX.Element {
  return (
    <header
      className="border-b"
      style={{ backgroundColor: studio.primaryColor, color: "white" }}
    >
      <div className="container flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {studio.logoUrl ? (
            <Image
              src={studio.logoUrl}
              alt={`${studio.name} logo`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-md object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white/10">
              <Dumbbell className="h-5 w-5" aria-hidden />
            </span>
          )}
          <div>
            <p className="text-lg font-semibold leading-tight">{studio.name}</p>
            <p className="text-xs text-white/80">
              {studio.slug}.fitstudio.app
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="secondary" size="sm">
                Sign in
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
