import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Dumbbell } from "lucide-react";
import type { Studio } from "@/prisma/generated/client";

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
      <div className="container flex h-20 flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
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
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/book"
            className="cursor-pointer rounded-md px-3 py-1.5 transition-colors duration-200 hover:bg-white/10"
          >
            Schedule
          </Link>
          <Link
            href="/membership"
            className="cursor-pointer rounded-md px-3 py-1.5 transition-colors duration-200 hover:bg-white/10"
          >
            Memberships
          </Link>
          <SignedIn>
            <Link
              href="/bookings"
              className="cursor-pointer rounded-md px-3 py-1.5 transition-colors duration-200 hover:bg-white/10"
            >
              My bookings
            </Link>
          </SignedIn>
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
        </nav>
      </div>
    </header>
  );
}
