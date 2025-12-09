import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/hooks/useAuth";
import { PendingApproval } from "@/components/pending-approval";
import { LocationProvider, useLocationContext } from "@/contexts/LocationContext";
import { GuestCartProvider } from "@/contexts/GuestCartContext";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Account from "@/pages/account";
import Orders from "@/pages/orders";
import About from "@/pages/about";
import Contact from "@/pages/contact";

import AdminDashboard from "@/pages/admin/index";
import AdminApprovals from "@/pages/admin/approvals";
import AdminOrders from "@/pages/admin/orders";
import AdminProducts from "@/pages/admin/products";
import AdminCustomers from "@/pages/admin/customers";
import AdminPaypal from "@/pages/admin/paypal";
import AdminShipping from "@/pages/admin/shipping";
import AuthPage from "@/pages/auth-page";

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isPending, isRejected, isApproved } = useAuth();
  const { isPortugal, canAccessPricesAsInternational, isLoading: locationLoading } = useLocationContext();

  if (isLoading || locationLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </PublicLayout>
    );
  }

  if (canAccessPricesAsInternational) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  if (isPortugal) {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return null;
    }

    if (isPending || isRejected) {
      return (
        <PublicLayout>
          <PendingApproval />
        </PublicLayout>
      );
    }

    if (!isApproved) {
      return (
        <PublicLayout>
          <PendingApproval />
        </PublicLayout>
      );
    }
  }

  return <PublicLayout>{children}</PublicLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  if (!isAdmin) {
    return <AdminLayout>{null}</AdminLayout>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <Switch>
        <Route path="/admin" component={() => (
          <AdminRoute><AdminDashboard /></AdminRoute>
        )} />
        <Route path="/admin/aprovacoes" component={() => (
          <AdminRoute><AdminApprovals /></AdminRoute>
        )} />
        <Route path="/admin/pedidos" component={() => (
          <AdminRoute><AdminOrders /></AdminRoute>
        )} />
        <Route path="/admin/produtos" component={() => (
          <AdminRoute><AdminProducts /></AdminRoute>
        )} />
        <Route path="/admin/clientes" component={() => (
          <AdminRoute><AdminCustomers /></AdminRoute>
        )} />
        <Route path="/admin/paypal" component={() => (
          <AdminRoute><AdminPaypal /></AdminRoute>
        )} />
        <Route path="/admin/frete" component={() => (
          <AdminRoute><AdminShipping /></AdminRoute>
        )} />
        <Route component={() => (
          <AdminRoute><NotFound /></AdminRoute>
        )} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={() => (
        <PublicLayout><Landing /></PublicLayout>
      )} />
      <Route path="/login" component={() => (
        <PublicLayout><AuthPage /></PublicLayout>
      )} />
      <Route path="/inicio" component={() => (
        <ProtectedRoute><Home /></ProtectedRoute>
      )} />
      <Route path="/produtos" component={() => (
        <ProtectedRoute><Products /></ProtectedRoute>
      )} />
      <Route path="/produto/:slug" component={() => (
        <ProtectedRoute><ProductDetail /></ProtectedRoute>
      )} />
      <Route path="/carrinho" component={() => (
        <ProtectedRoute><Cart /></ProtectedRoute>
      )} />
      <Route path="/checkout" component={() => (
        <ProtectedRoute><Checkout /></ProtectedRoute>
      )} />
      <Route path="/minha-conta" component={() => (
        <ProtectedRoute><Account /></ProtectedRoute>
      )} />
      <Route path="/meus-pedidos" component={() => (
        <ProtectedRoute><Orders /></ProtectedRoute>
      )} />
      <Route path="/sobre" component={() => (
        <PublicLayout><About /></PublicLayout>
      )} />
      <Route path="/contacto" component={() => (
        <PublicLayout><Contact /></PublicLayout>
      )} />
      <Route component={() => (
        <PublicLayout><NotFound /></PublicLayout>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cara-ui-theme">
        <TooltipProvider>
          <LocationProvider>
            <GuestCartProvider>
              <Router />
              <Toaster />
            </GuestCartProvider>
          </LocationProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
