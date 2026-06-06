"use client";

import * as React from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api-client";

interface CheckoutInitResponse {
  kind: "payment_intent" | "subscription";
  clientSecret: string;
  amount: number;
  currency: "EUR" | "AED" | "USD" | "LBP";
  stripeAccountId: string;
  publishableKey: string;
  subscriptionId?: string;
}

interface PlanSummary {
  id: string;
  name: string;
  price: string;
  currency: "EUR" | "AED" | "USD" | "LBP";
  billingInterval: "MONTHLY" | "ANNUAL" | "ONE_TIME";
  type: "UNLIMITED" | "CLASS_PACK" | "DROP_IN";
  classCount: number | null;
}

interface CheckoutFormProps {
  studio: {
    name: string;
    country: "ES" | "AE" | "LB";
  };
  plan: PlanSummary;
  appUrl: string;
  onCancel: () => void;
}

const stripeCache = new Map<string, Promise<Stripe | null>>();

function getStripeForAccount(
  publishableKey: string,
  stripeAccount: string,
): Promise<Stripe | null> {
  const cacheKey = `${publishableKey}:${stripeAccount}`;
  let cached = stripeCache.get(cacheKey);
  if (!cached) {
    cached = loadStripe(publishableKey, { stripeAccount });
    stripeCache.set(cacheKey, cached);
  }
  return cached;
}

function SepaMandate({ studioName }: { studioName: string }): JSX.Element {
  return (
    <div className="rounded-md border border-muted bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
      <p>
        Al proporcionar su información de pago y confirmar este pago,
        autoriza a {studioName} y a Stripe, nuestro proveedor de servicios
        de pago, a enviar instrucciones a su banco para cargar en su cuenta
        y a su banco para cargar en su cuenta de acuerdo con esas
        instrucciones.
      </p>
    </div>
  );
}

function PaymentForm({
  studio,
  plan,
  onCancel,
}: {
  studio: CheckoutFormProps["studio"];
  plan: PlanSummary;
  onCancel: () => void;
}): JSX.Element {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setSubmitting(true);
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
          confirmParams: {
            return_url: `${window.location.origin}/bookings`,
          },
        });
        setSubmitting(false);
        if (error) {
          toast.error(error.message ?? "Payment failed");
          return;
        }
        if (paymentIntent?.status === "succeeded") {
          toast.success("Payment successful");
          router.push("/bookings");
          router.refresh();
        } else if (paymentIntent?.status === "processing") {
          toast.info("Payment is processing — we'll email a receipt shortly.");
          router.push("/bookings");
        }
      }}
    >
      <PaymentElement
        options={{
          layout: { type: "tabs", defaultCollapsed: false },
          terms: { sepaDebit: "auto" },
        }}
      />
      {studio.country === "ES" ? <SepaMandate studioName={studio.name} /> : null}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="cursor-pointer gap-2"
          onClick={onCancel}
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to plans
        </Button>
        <Button
          type="submit"
          className="cursor-pointer gap-2 transition-colors duration-200"
          disabled={submitting || !stripe}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {submitting ? "Processing…" : `Pay ${plan.price} ${plan.currency}`}
        </Button>
      </div>
    </form>
  );
}

export function CheckoutForm({
  studio,
  plan,
  onCancel,
}: CheckoutFormProps): JSX.Element {
  const init = useMutation({
    mutationFn: () =>
      fetchJson<CheckoutInitResponse>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ membershipId: plan.id }),
      }),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Checkout failed"),
  });

  React.useEffect(() => {
    init.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id]);

  const stripePromise = React.useMemo(() => {
    if (!init.data?.publishableKey) return null;
    return getStripeForAccount(
      init.data.publishableKey,
      init.data.stripeAccountId,
    );
  }, [init.data?.publishableKey, init.data?.stripeAccountId]);

  if (init.isPending || !init.data || !stripePromise) {
    return (
      <div className="space-y-3 rounded-md border bg-muted/30 p-6">
        <p className="text-sm text-muted-foreground">
          Preparing secure checkout…
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse bg-primary motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: init.data.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0F172A",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PaymentForm
        studio={studio}
        plan={plan}
        onCancel={onCancel}
      />
    </Elements>
  );
}
