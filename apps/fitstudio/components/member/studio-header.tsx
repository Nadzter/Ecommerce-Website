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
      className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md"
      style={{
        backgroundImage: `linear-gradient(135deg, ${studio.primaryColor} 0%, ${studio.primaryColor}f0 100%)`,
        color: "white",
      }}
    >
      <div className="container flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {studio.logoUrl ? (
            <Image
              src={studio.logoUrl}
              alt={`${studio.name} logo`}
              width={44}
              height={44}
              className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/20 sm:h-11 sm:w-11"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 sm:h-11 sm:w-11">
              <Dumbbell className="h-5 w-5" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight sm:text-lg">
              {studio.name}
            </p>
            <p className="hidden text-[11px] uppercase tracking-[0.18em] text-white/60 sm:block">
              Member portal
            </p>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-foreground hover:bg-white/90"
              >
                Sign in
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
      <nav className="container -mb-px flex items-center gap-1 overflow-x-auto pb-0 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <NavLink href="/">Schedule</NavLink>
        <NavLink href="/membership">Memberships</NavLink>
        <SignedIn>
          <NavLink href="/bookings">My bookings</NavLink>
        </SignedIn>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Link
      href={href}
      className="relative whitespace-nowrap px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}
