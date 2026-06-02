"use client";

import * as React from "react";
import { CreditCard, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

interface StripeConnectButtonProps {
  isConnected: boolean;
}

/**
 * Owner-facing trigger that begins the Stripe Connect OAuth handshake.
 * The actual redirect happens server-side in /api/stripe/connect; we just
 * navigate the browser there.
 */
export function StripeConnectButton({
  isConnected,
}: StripeConnectButtonProps): JSX.Element {
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      type="button"
      variant={isConnected ? "outline" : "default"}
      size="sm"
      disabled={pending}
      className="cursor-pointer gap-2 transition-colors duration-200"
      onClick={() => {
        setPending(true);
        window.location.href = "/api/stripe/connect";
      }}
    >
      {isConnected ? (
        <>
          <ExternalLink className="h-4 w-4" aria-hidden />
          Manage Stripe account
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" aria-hidden />
          {pending ? "Redirecting…" : "Connect Stripe"}
        </>
      )}
    </Button>
  );
}
