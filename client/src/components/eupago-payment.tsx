import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type EupagoMethod = "multibanco" | "mbway";

export function EupagoPayment(props: {
  method: EupagoMethod;
  shippingAddress: string;
  notes: string;
  shippingOptionId?: string;
  countryCode?: string | null;
  region?: string | null;
  items?: Array<{ productId: string; quantity: number }>;
  disabled?: boolean;
  onSuccess?: (details: { orderId: string }) => void;
  onError?: (error: Error) => void;
}) {
  const [mbwayPhone, setMbwayPhone] = useState("");
  const [result, setResult] = useState<any>(null);

  const endpoint = props.method === "multibanco" ? "/api/eupago/multibanco" : "/api/eupago/mbway";

  const canSubmit = useMemo(() => {
    if (props.disabled) return false;
    if (!props.shippingAddress || props.shippingAddress.trim().length < 10) return false;
    if (props.method === "mbway") {
      return mbwayPhone.trim().length >= 9;
    }
    return true;
  }, [props.disabled, props.shippingAddress, props.method, mbwayPhone]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        shippingAddress: props.shippingAddress,
        notes: props.notes,
        shippingOptionId: props.shippingOptionId,
        countryCode: props.countryCode,
        region: props.region,
        items: props.items,
      };
      if (props.method === "mbway") {
        payload.phone = mbwayPhone.trim();
      }

      const res = await apiRequest("POST", endpoint, payload);
      return res.json();
    },
    onSuccess: (data: any) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      props.onSuccess?.({ orderId: data.orderId });
    },
    onError: (err: any) => {
      const e = err instanceof Error ? err : new Error("Não foi possível processar o pagamento.");
      props.onError?.(e);
    },
  });

  return (
    <div className="space-y-3">
      {props.method === "mbway" && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Número MBWay</div>
          <Input
            value={mbwayPhone}
            onChange={(e) => setMbwayPhone(e.target.value)}
            placeholder="9XXXXXXXX"
            inputMode="tel"
            autoComplete="tel"
          />
          <div className="text-xs text-muted-foreground">
            Confirme o pagamento na app MB WAY (validade curta).
          </div>
        </div>
      )}

      <Button className="w-full" onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            A processar...
          </>
        ) : props.method === "multibanco" ? (
          "Gerar referência Multibanco"
        ) : (
          "Enviar pedido MBWay"
        )}
      </Button>

      {result?.success && props.method === "multibanco" && (
        <Alert>
          <AlertTitle>Referência Multibanco gerada</AlertTitle>
          <AlertDescription>
            {result.entity && result.reference ? (
              <div className="space-y-1">
                <div>Entidade: {String(result.entity)}</div>
                <div>Referência: {String(result.reference)}</div>
                <div>
                  Valor: {Number(result.total || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                </div>
              </div>
            ) : (
              <div>Pedido criado. Verifique os detalhes do pagamento no seu email/backoffice EuPago.</div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {result?.success && props.method === "mbway" && (
        <Alert>
          <AlertTitle>Pedido MBWay enviado</AlertTitle>
          <AlertDescription>
            <div className="space-y-1">
              <div>Confirme o pagamento na app MB WAY.</div>
              {result.transactionId && <div>TRID: {String(result.transactionId)}</div>}
              {result.total && (
                <div>
                  Valor: {Number(result.total).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {mutation.isError && (
        <div className="text-sm text-destructive">Não foi possível processar. Tente novamente.</div>
      )}
    </div>
  );
}
