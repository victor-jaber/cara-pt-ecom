import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type StripePaymentProps = {
  publishableKey: string;
  disabled?: boolean;
  shippingAddress: string;
  notes: string;
  shippingOptionId?: string;
  countryCode?: string | null;
  region?: string | null;
  items?: Array<{ productId: string; quantity: number }>;
  onSuccess: (details: { orderId: string; paymentIntentId: string }) => void;
  onError: (error: Error) => void;
};

type IntentResponse = {
  paymentIntentId: string;
  clientSecret: string;
};

function StripePaymentInner({
  disabled,
  paymentIntentId,
  onSuccess,
  onError,
}: {
  disabled?: boolean;
  paymentIntentId: string;
  onSuccess: StripePaymentProps["onSuccess"];
  onError: StripePaymentProps["onError"];
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    setIsPaying(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "Falha ao confirmar pagamento");
      }

      const confirmRes = await fetch("/api/stripe/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({}));
        throw new Error(err.message || "Falha ao confirmar pagamento no servidor");
      }

      const details = await confirmRes.json();
      onSuccess({ orderId: details.orderId, paymentIntentId });
    } catch (e) {
      onError(e instanceof Error ? e : new Error("Erro no pagamento"));
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <div className="rounded-md border p-3">
        <PaymentElement />
      </div>
      <Button
        className="w-full mt-3"
        onClick={handlePay}
        disabled={disabled || isPaying || !stripe || !elements}
        data-testid="button-stripe-pay"
      >
        {isPaying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            A processar...
          </>
        ) : (
          "Pagar com Stripe"
        )}
      </Button>
    </div>
  );
}

export function StripePayment({
  publishableKey,
  disabled,
  shippingAddress,
  notes,
  shippingOptionId,
  countryCode,
  region,
  items,
  onSuccess,
  onError,
}: StripePaymentProps) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const createIntent = async () => {
      setError(null);
      setIsLoading(true);
      setIntent(null);

      try {
        const res = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            shippingOptionId,
            countryCode,
            region,
            shippingAddress,
            notes,
            items,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Não foi possível iniciar pagamento Stripe");
        }

        const data = (await res.json()) as IntentResponse;
        if (!data.clientSecret || !data.paymentIntentId) {
          throw new Error("Stripe não retornou clientSecret");
        }

        if (!cancelled) {
          setIntent(data);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erro ao iniciar Stripe";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (!publishableKey || disabled) return;
    if (!shippingAddress || shippingAddress.trim().length < 10) return;
    createIntent();

    return () => {
      cancelled = true;
    };
    // Recreate intent when key checkout inputs change.
  }, [publishableKey, disabled, shippingOptionId, countryCode, region, shippingAddress, notes, JSON.stringify(items || [])]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !intent) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret: intent.clientSecret }}>
      <StripePaymentInner
        disabled={disabled}
        paymentIntentId={intent.paymentIntentId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
