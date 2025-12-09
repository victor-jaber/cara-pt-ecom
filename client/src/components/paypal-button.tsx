import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: Error) => void;
        onCancel?: () => void;
        style?: {
          layout?: "vertical" | "horizontal";
          color?: "gold" | "blue" | "silver" | "white" | "black";
          shape?: "rect" | "pill";
          label?: "paypal" | "checkout" | "buynow" | "pay";
          height?: number;
        };
      }) => {
        render: (container: HTMLElement) => Promise<void>;
      };
    };
  }
}

interface PayPalSetup {
  clientId: string;
  enabled: boolean;
  mode: "sandbox" | "live";
}

interface CartItem {
  price: number;
  quantity: number;
  name?: string;
}

interface PayPalButtonProps {
  cart: CartItem[];
  shippingAddress: string;
  notes?: string;
  onSuccess: (details: {
    paypalOrderId: string;
    paypalCaptureId: string;
    payerEmail: string;
    orderId?: string;
  }) => void;
  onError: (error: Error) => void;
  disabled?: boolean;
}

export function PayPalButton({ 
  cart, 
  shippingAddress, 
  notes = "", 
  onSuccess, 
  onError,
  disabled = false 
}: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [buttonsRendered, setButtonsRendered] = useState(false);

  const { data: setup, isLoading: setupLoading } = useQuery<PayPalSetup>({
    queryKey: ["/api/paypal/setup"],
  });

  useEffect(() => {
    if (!setup?.enabled || !setup?.clientId || scriptLoaded) return;

    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${setup.clientId}&currency=EUR&intent=capture`;
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setScriptError("Não foi possível carregar o PayPal. Tente novamente mais tarde.");
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [setup, scriptLoaded]);

  useEffect(() => {
    if (!scriptLoaded || !paypalRef.current || !window.paypal || buttonsRendered || disabled) return;

    paypalRef.current.innerHTML = "";

    window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "paypal",
        height: 45,
      },
      createOrder: async () => {
        try {
          const response = await fetch("/api/paypal/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
              cart: cart.map(item => ({
                price: item.price,
                quantity: item.quantity,
                name: item.name || "Produto CARA"
              })),
              shippingAddress,
              notes,
            }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erro ao criar pedido PayPal");
          }
          
          const order = await response.json();
          return order.id;
        } catch (err) {
          onError(err instanceof Error ? err : new Error("Erro ao criar pedido"));
          throw err;
        }
      },
      onApprove: async (data) => {
        try {
          const response = await fetch(`/api/paypal/order/${data.orderID}/capture`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ shippingAddress, notes }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erro ao processar pagamento");
          }
          
          const details = await response.json();
          onSuccess({
            paypalOrderId: details.paypalOrderId,
            paypalCaptureId: details.paypalCaptureId,
            payerEmail: details.payerEmail,
            orderId: details.orderId,
          });
        } catch (err) {
          onError(err instanceof Error ? err : new Error("Erro ao capturar pagamento"));
        }
      },
      onError: (err) => {
        onError(err);
      },
      onCancel: () => {
        console.log("PayPal checkout cancelled");
      },
    }).render(paypalRef.current!).then(() => {
      setButtonsRendered(true);
    });
  }, [scriptLoaded, cart, shippingAddress, notes, onSuccess, onError, buttonsRendered, disabled]);

  useEffect(() => {
    setButtonsRendered(false);
  }, [cart, shippingAddress, notes]);

  if (setupLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!setup?.enabled) {
    return null;
  }

  if (scriptError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{scriptError}</AlertDescription>
      </Alert>
    );
  }

  if (!setup?.clientId) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div 
        ref={paypalRef} 
        data-testid="paypal-button-container"
        className={disabled ? "opacity-50 pointer-events-none" : ""}
      />
      {!scriptLoaded && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
