import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Clock,
  UserCheck,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import type { User, Order } from "@shared/schema";

export default function AdminDashboard() {
  const { data: pendingUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users", { status: "pending" }],
  });

  const { data: pendingOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders", { status: "pending" }],
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: allOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const approvedUsers = allUsers.filter(u => u.status === "approved");
  const thisMonthOrders = allOrders.filter(o => {
    const orderDate = new Date(o.createdAt!);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });

  const totalRevenue = thisMonthOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

  const stats = [
    {
      title: "Aprovações Pendentes",
      value: pendingUsers.length,
      icon: Clock,
      href: "/admin/aprovacoes",
      color: "text-amber-500",
    },
    {
      title: "Pedidos Pendentes",
      value: pendingOrders.length,
      icon: ShoppingCart,
      href: "/admin/pedidos",
      color: "text-blue-500",
    },
    {
      title: "Clientes Aprovados",
      value: approvedUsers.length,
      icon: UserCheck,
      href: "/admin/clientes",
      color: "text-green-500",
    },
    {
      title: "Vendas do Mês",
      value: `€${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      href: "/admin/pedidos",
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-admin-title">
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerir aprovações, pedidos e clientes
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s/g, "-")}`}>
                {stat.value}
              </div>
              <Link href={stat.href}>
                <Button variant="ghost" size="sm" className="mt-2 -ml-2">
                  Ver detalhes
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registos Recentes
            </CardTitle>
            <Link href="/admin/aprovacoes">
              <Button variant="outline" size="sm">
                Ver Todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum registo pendente de aprovação
              </p>
            ) : (
              <div className="space-y-3">
                {pendingUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                    data-testid={`pending-user-${user.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.clinicName || user.email}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Pendente
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pedidos Recentes
            </CardTitle>
            <Link href="/admin/pedidos">
              <Button variant="outline" size="sm">
                Ver Todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {allOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum pedido registado
              </p>
            ) : (
              <div className="space-y-3">
                {allOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                    data-testid={`recent-order-${order.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        Pedido #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        €{parseFloat(order.total).toFixed(2)}
                      </p>
                    </div>
                    <Badge
                      variant={order.status === "pending" ? "secondary" : "default"}
                    >
                      {order.status === "pending" && "Pendente"}
                      {order.status === "confirmed" && "Confirmado"}
                      {order.status === "shipped" && "Enviado"}
                      {order.status === "delivered" && "Entregue"}
                      {order.status === "cancelled" && "Cancelado"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
