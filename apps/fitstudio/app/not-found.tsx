import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Studio not found
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        We could not resolve a FitStudio tenant from this URL. In development
        you can append <code>?studio=&lt;slug&gt;</code> to simulate a
        subdomain.
      </p>
      <Button asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
    </div>
  );
}
