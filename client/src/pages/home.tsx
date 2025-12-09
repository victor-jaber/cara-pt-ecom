import { useAuth } from "@/hooks/useAuth";
import { PendingApproval } from "@/components/pending-approval";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ProductGridSkeleton } from "@/components/loading-skeleton";
import { ProductCard } from "@/components/product-card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, OrderWithItems } from "@shared/schema";
import { Package, ShoppingBag, ArrowRight, TrendingUp } from "lucide-react";

export default function Home() {
  const { user, isApproved, isPending, isRejected } = useAuth();
  const { toast } = useToast();

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isApproved,
  });

  const { data: recentOrders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", "recent"],
    enabled: isApproved,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/cart", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado ao carrinho.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao carrinho.",
        variant: "destructive",
      });
    },
  });

  if (isPending) {
    return <PendingApproval />;
  }

  if (isRejected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Acesso Negado</CardTitle>
            <CardDescription>
              Infelizmente o seu pedido de acesso não foi aprovado. Por favor contacte-nos para mais informações.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <a href="mailto:geral@cara.com.pt">Contactar Suporte</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Bem-vindo{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore o nosso catálogo de produtos premium.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/produtos">
            <Button data-testid="button-view-all-products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ver Produtos
            </Button>
          </Link>
          <Link href="/meus-pedidos">
            <Button variant="outline" data-testid="button-view-orders">
              <Package className="mr-2 h-4 w-4" />
              Meus Pedidos
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produtos Disponíveis</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              <p className="text-2xl font-bold">{recentOrders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant="default" className="mt-1">Conta Ativa</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
          <Link href="/produtos">
            <Button variant="ghost" size="sm">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {productsLoading ? (
          <ProductGridSkeleton count={4} />
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhum produto disponível</h3>
              <p className="text-muted-foreground mt-1">
                Os produtos serão adicionados em breve.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(p) => addToCartMutation.mutate(p.id)}
                isLoading={addToCartMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Pedidos Recentes</h2>
            <Link href="/meus-pedidos">
              <Button variant="ghost" size="sm">
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {recentOrders.slice(0, 3).map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Pedido #{order.id.slice(-8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt!).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "default"
                          : order.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {order.status === "pending" && "Pendente"}
                      {order.status === "confirmed" && "Confirmado"}
                      {order.status === "shipped" && "Enviado"}
                      {order.status === "delivered" && "Entregue"}
                      {order.status === "cancelled" && "Cancelado"}
                    </Badge>
                    <span className="font-semibold">
                      {Number(order.total).toLocaleString("pt-PT", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
