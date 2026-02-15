import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  Clock,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Euro,
  Activity,
  AlertCircle,
  CheckCircle2,
  Truck,
  XCircle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import type { User, Order } from "@shared/schema";

export default function AdminDashboard() {
  const { data: pendingUsers = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users", { status: "pending" }],
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: allOrders = [], isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const approvedUsers = allUsers.filter(u => u.status === "approved");
  const pendingOrders = allOrders.filter(o => o.status === "pending");
  
  const now = new Date();
  const thisMonthOrders = allOrders.filter(o => {
    const orderDate = new Date(o.createdAt!);
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });

  const lastMonthOrders = allOrders.filter(o => {
    const orderDate = new Date(o.createdAt!);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear();
  });

  const totalRevenue = thisMonthOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const revenueChange = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

  const getLast7DaysData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toLocaleDateString('pt-PT', { weekday: 'short' });
      const ordersOnDay = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt!);
        return orderDate.toDateString() === date.toDateString();
      });
      const revenue = ordersOnDay.reduce((sum, o) => sum + parseFloat(o.total), 0);
      days.push({
        name: dayStr.charAt(0).toUpperCase() + dayStr.slice(1, 3),
        pedidos: ordersOnDay.length,
        receita: revenue,
      });
    }
    return days;
  };

  const getOrderStatusData = () => {
    const statusCounts = {
      pending: allOrders.filter(o => o.status === "pending").length,
      confirmed: allOrders.filter(o => o.status === "confirmed").length,
      shipped: allOrders.filter(o => o.status === "shipped").length,
      delivered: allOrders.filter(o => o.status === "delivered").length,
      cancelled: allOrders.filter(o => o.status === "cancelled").length,
    };
    return [
      { name: "Pendente", value: statusCounts.pending, color: "hsl(var(--chart-3))" },
      { name: "Pagamento Confirmado", value: statusCounts.confirmed, color: "hsl(var(--chart-1))" },
      { name: "Enviado", value: statusCounts.shipped, color: "hsl(var(--chart-2))" },
      { name: "Entregue", value: statusCounts.delivered, color: "hsl(var(--chart-4))" },
      { name: "Cancelado", value: statusCounts.cancelled, color: "hsl(var(--chart-5))" },
    ].filter(item => item.value > 0);
  };

  const chartData = getLast7DaysData();
  const orderStatusData = getOrderStatusData();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof CheckCircle2 }> = {
      pending: { label: "Pendente", variant: "secondary", icon: Clock },
      confirmed: { label: "Pagamento Confirmado", variant: "default", icon: CheckCircle2 },
      shipped: { label: "Enviado", variant: "outline", icon: Truck },
      delivered: { label: "Entregue", variant: "default", icon: CheckCircle2 },
      cancelled: { label: "Cancelado", variant: "destructive", icon: XCircle },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loadingUsers || loadingOrders) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-admin-title">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do negócio e métricas em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 px-3 py-1">
            <Activity className="h-3 w-3 text-green-500" />
            Sistema Ativo
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden" data-testid="card-stat-revenue">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas do Mês
            </CardTitle>
            <div className="p-2 rounded-full bg-primary/10">
              <Euro className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-vendas-do-mês">
              €{totalRevenue.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
              )}
              <span className={`text-xs ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-stat-orders">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Pendentes
            </CardTitle>
            <div className="p-2 rounded-full bg-blue-500/10">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pedidos-pendentes">
              {pendingOrders.length}
            </div>
            <Link href="/admin/pedidos">
              <Button variant="ghost" size="sm" className="p-0 h-auto text-xs text-muted-foreground">
                Ver pedidos <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-stat-approvals">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovações Pendentes
            </CardTitle>
            <div className="p-2 rounded-full bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-aprovações-pendentes">
              {pendingUsers.length}
            </div>
            <Link href="/admin/aprovacoes">
              <Button variant="ghost" size="sm" className="p-0 h-auto text-xs text-muted-foreground">
                Gerir aprovações <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-stat-customers">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Aprovados
            </CardTitle>
            <div className="p-2 rounded-full bg-green-500/10">
              <UserCheck className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-clientes-aprovados">
              {approvedUsers.length}
            </div>
            <Link href="/admin/clientes">
              <Button variant="ghost" size="sm" className="p-0 h-auto text-xs text-muted-foreground">
                Ver clientes <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Atividade dos Últimos 7 Dias
            </CardTitle>
            <CardDescription>
              Pedidos e receita diária
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [
                      name === 'receita' ? `€${value.toFixed(2)}` : value,
                      name === 'receita' ? 'Receita' : 'Pedidos'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorReceita)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Estado dos Pedidos
            </CardTitle>
            <CardDescription>
              Distribuição por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum pedido registado</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Aprovações Pendentes
              </CardTitle>
              <CardDescription>
                Profissionais aguardando verificação
              </CardDescription>
            </div>
            <Link href="/admin/aprovacoes">
              <Button variant="outline" size="sm">
                Ver Todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-2 text-green-500/50" />
                <p className="font-medium">Tudo em dia!</p>
                <p className="text-sm">Nenhuma aprovação pendente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.slice(0, 4).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover-elevate transition-all"
                    data-testid={`pending-user-${user.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.profession} {user.clinicName ? `- ${user.clinicName}` : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pendente
                    </Badge>
                  </div>
                ))}
                {pendingUsers.length > 4 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    + {pendingUsers.length - 4} mais aguardando
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                Pedidos Recentes
              </CardTitle>
              <CardDescription>
                Últimos pedidos realizados
              </CardDescription>
            </div>
            <Link href="/admin/pedidos">
              <Button variant="outline" size="sm">
                Ver Todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {allOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mb-2 opacity-50" />
                <p className="font-medium">Nenhum pedido</p>
                <p className="text-sm">Os pedidos aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover-elevate transition-all"
                    data-testid={`recent-order-${order.id}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          €{parseFloat(order.total).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                ))}
                {allOrders.length > 4 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    + {allOrders.length - 4} mais pedidos
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
