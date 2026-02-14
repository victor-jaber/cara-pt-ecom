import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Package, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import type { OrderWithItems } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useLocationContext } from "@/contexts/LocationContext";

export default function Orders() {
  const { user } = useAuth();
  const { isInternational } = useLocationContext();
  
  // International users use the alternative route with userId in path
  const ordersEndpoint = isInternational && user 
    ? `/api/international-orders/${user.id}` 
    : "/api/orders";
  
  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: [ordersEndpoint],
    enabled: !!user,
    staleTime: 0,
    refetchInterval: (query) => {
      const list: any[] = (query as any)?.state?.data;
      const hasPendingEupago = Array.isArray(list)
        ? list.some(
            (o) =>
              (o?.paymentMethod === "eupago_multibanco" || o?.paymentMethod === "eupago_mbway") &&
              o?.paymentStatus !== "completed" &&
              o?.status !== "confirmed",
          )
        : false;
      return hasPendingEupago ? 5000 : false;
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
      confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
      shipped: { label: "Enviado", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
      delivered: { label: "Entregue", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mt-1">
              Ainda não realizou nenhum pedido.
            </p>
            <Link href="/produtos">
              <Button className="mt-4" data-testid="button-view-products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Ver Produtos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>

      <Accordion type="single" collapsible className="space-y-4">
        {orders.map((order) => (
          <AccordionItem key={order.id} value={order.id} className="border rounded-lg" data-testid={`order-${order.id}`}>
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 text-left pr-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Pedido #{order.id.slice(-8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt!).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-13 sm:ml-0">
                  {getStatusBadge(order.status)}
                  <span className="font-semibold">
                    {Number(order.total).toLocaleString("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Produtos</h4>
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-background flex items-center justify-center flex-shrink-0">
                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">CARA</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Number(item.price).toLocaleString("pt-PT", {
                              style: "currency",
                              currency: "EUR",
                            })} x {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">
                        {(Number(item.price) * item.quantity).toLocaleString("pt-PT", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Endereço de Envio</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {order.shippingAddress}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Notas</h4>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
