import { useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { OrderWithItems } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useLocationContext } from "@/contexts/LocationContext";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function getStatusBadge(status: string) {
  const variants: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    shipped: { label: "Enviado", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    delivered: { label: "Entregue", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  };
  const variant = variants[status] || variants.pending;
  return <Badge className={variant.className}>{variant.label}</Badge>;
}

function formatCurrencyEUR(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
    : "-";
}

export default function OrderConfirmation() {
  const [, params] = useRoute("/pedido/:id");
  const orderId = params?.id;

  const { toast } = useToast();
  const { user } = useAuth();
  const { isInternational } = useLocationContext();

  const internationalEndpoint = useMemo(() => {
    if (!isInternational) return null;
    if (!user?.id) return null;
    return `/api/international-orders/${user.id}`;
  }, [isInternational, user?.id]);

  const isInternationalReady = !isInternational || Boolean(internationalEndpoint);

  const portugalOrderQuery = useQuery<OrderWithItems>({
    queryKey: [orderId ? `/api/orders/${orderId}` : ""],
    enabled: Boolean(orderId) && !isInternational,
    staleTime: 0,
    refetchInterval: (query) => {
      const currentOrder: any = (query as any)?.state?.data;
      if (!currentOrder) return 5000;
      if (currentOrder.paymentStatus === "completed" || currentOrder.status === "confirmed") return false;
      return 5000;
    },
  });

  const internationalOrdersQuery = useQuery<OrderWithItems[]>({
    queryKey: [internationalEndpoint || ""],
    enabled: Boolean(orderId) && isInternational && Boolean(internationalEndpoint),
    staleTime: 0,
    refetchInterval: (query) => {
      const orders: any[] = (query as any)?.state?.data;
      const selected = Array.isArray(orders) ? orders.find((o) => o?.id === orderId) : null;
      if (!selected) return 5000;
      if (selected.paymentStatus === "completed" || selected.status === "confirmed") return false;
      return 5000;
    },
  });

  const order = useMemo(() => {
    if (!orderId) return null;
    if (!isInternational) return (portugalOrderQuery.data as any) || null;
    const orders = internationalOrdersQuery.data || [];
    return orders.find((o) => o.id === orderId) || null;
  }, [orderId, isInternational, portugalOrderQuery.data, internationalOrdersQuery.data]);

  const isLoading = isInternational ? internationalOrdersQuery.isLoading : portugalOrderQuery.isLoading;
  const error = isInternational ? internationalOrdersQuery.error : portugalOrderQuery.error;

  const eupago = (order as any)?.paymentMetadata?.eupago as any;
  const isEupago =
    (order as any)?.paymentMethod === "eupago_multibanco" || (order as any)?.paymentMethod === "eupago_mbway";

  const isConfirmed = order?.status === "confirmed" || (order as any)?.paymentStatus === "completed";

  const orderShortId = order?.id ? order.id.slice(-8) : "";

  const copyToClipboard = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copiado", description: `${label} copiado para a área de transferência.` });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "O seu navegador bloqueou o acesso à área de transferência.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInternationalReady) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Detalhes do pedido</h1>
        <Card>
          <CardContent className="p-8 space-y-4">
            <div className="text-sm text-muted-foreground">
              Não foi possível identificar o utilizador para carregar este pedido.
            </div>
            <Link href="/meus-pedidos">
              <Button>Ir para Meus pedidos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !orderId || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Detalhes do pedido</h1>
        <Card>
          <CardContent className="p-8 space-y-4">
            <div className="text-sm text-muted-foreground">
              Não foi possível carregar os detalhes do pedido.
            </div>
            <Link href="/meus-pedidos">
              <Button>Ir para Meus pedidos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {isConfirmed ? "Pedido Confirmado com Sucesso" : `Pedido ${orderShortId ? `#${orderShortId}` : ""}`}
          </h1>
          <div className="text-sm text-muted-foreground">
            {isConfirmed && orderShortId ? `Referência: #${orderShortId}` : ""}
            {order.createdAt ? `${isConfirmed && orderShortId ? " • " : ""}${new Date(order.createdAt).toLocaleString("pt-PT")}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(order.status)}
          <div className="font-semibold">{formatCurrencyEUR(order.total)}</div>
        </div>
      </div>

      {isEupago && order.paymentStatus !== "completed" && order.status !== "confirmed" && (
        <Alert className="mb-6" variant={(order as any).paymentMethod === "eupago_mbway" ? "destructive" : "default"}>
          <AlertTitle>
            {(order as any).paymentMethod === "eupago_mbway" ? "⏱️ Ação Urgente Necessária" : "A aguardar pagamento"}
          </AlertTitle>
          <AlertDescription>
            {(order as any).paymentMethod === "eupago_mbway" ? (
              <>
                <b>Tem apenas 5 minutos</b> para confirmar este pagamento no app MB WAY! Abra o app <b>agora mesmo</b> e aprove o pagamento pendente.
              </>
            ) : (
              <>Assim que o pagamento for confirmado, este pedido mudará automaticamente para <b>Confirmado</b>.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isConfirmed ? (
          <Card>
            <CardHeader>
              <CardTitle>Pedido Confirmado com Sucesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                O seu pedido foi confirmado e está a ser preparado. Não é necessário realizar mais nenhuma ação de pagamento.
              </div>

              <div className="flex gap-3">
                <Link href="/meus-pedidos">
                  <Button>Ver meus pedidos</Button>
                </Link>
                <Link href="/produtos">
                  <Button variant="outline">Continuar a comprar</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Próximos passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEupago && <div className="text-sm text-muted-foreground">Este pedido não foi criado via EuPago.</div>}

              {(order as any).paymentMethod === "eupago_multibanco" && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    1) Abra o seu homebanking/app do banco e escolha <b>Pagamento de Serviços (Multibanco)</b>.<br />
                    2) Insira <b>Entidade</b> e <b>Referência</b> exatamente como abaixo.<br />
                    3) Confirme o pagamento. O status será atualizado automaticamente.
                  </div>

                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Entidade</div>
                        <div className="font-semibold">{eupago?.entity ? String(eupago.entity) : "-"}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!eupago?.entity}
                        onClick={() => copyToClipboard("Entidade", String(eupago.entity))}
                      >
                        Copiar
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Referência</div>
                        <div className="font-semibold">{eupago?.reference ? String(eupago.reference) : "-"}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!eupago?.reference}
                        onClick={() => copyToClipboard("Referência", String(eupago.reference))}
                      >
                        Copiar
                      </Button>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Valor</div>
                      <div className="font-semibold">{formatCurrencyEUR(order.total)}</div>
                    </div>
                  </div>
                </div>
              )}

              {(order as any).paymentMethod === "eupago_mbway" && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">📱</div>
                      <div className="flex-1">
                        <div className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Agora mesmo:</div>
                        <div className="text-sm text-amber-800 dark:text-amber-200">
                          <b>1. Abra o app MB WAY</b> no seu telemóvel agora<br />
                          <b>2. Confirme o pagamento pendente</b> (tem apenas 5 minutos!)<br />
                          <b>3. Aguarde</b> - esta página atualizará automaticamente quando o pagamento for confirmado
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Telefone</div>
                        <div className="font-semibold">{eupago?.phone ? String(eupago.phone) : "-"}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!eupago?.phone}
                        onClick={() => copyToClipboard("Telefone", String(eupago.phone))}
                      >
                        Copiar
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">TRID / Transação</div>
                        <div className="font-semibold">{eupago?.transactionId ? String(eupago.transactionId) : "-"}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!eupago?.transactionId}
                        onClick={() => copyToClipboard("TRID", String(eupago.transactionId))}
                      >
                        Copiar
                      </Button>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Valor</div>
                      <div className="font-semibold">{formatCurrencyEUR(order.total)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/meus-pedidos">
                  <Button variant="outline">Meus pedidos</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium">{String((order as any).paymentMethod || "-")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pagamento</span>
                <span className="font-medium">{String((order as any).paymentStatus || "-")}</span>
              </div>
            </div>

            {order.shippingAddress && (
              <div>
                <div className="text-sm font-medium mb-2">Endereço de envio</div>
                <div className="text-sm text-muted-foreground whitespace-pre-line">{order.shippingAddress}</div>
              </div>
            )}

            {order.notes && (
              <div>
                <div className="text-sm font-medium mb-2">Notas</div>
                <div className="text-sm text-muted-foreground">{order.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
