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
import { LanguageProvider } from "@/contexts/LanguageContext";
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
import OrderConfirmation from "@/pages/order-confirmation";
import About from "@/pages/about";
import Contact from "@/pages/contact";

import AdminDashboard from "@/pages/admin/index";
import AdminApprovals from "@/pages/admin/approvals";
import AdminOrders from "@/pages/admin/orders";
import AdminProducts from "@/pages/admin/products";
import AdminCustomers from "@/pages/admin/customers";
import AdminPaypal from "@/pages/admin/paypal";
import AdminShipping from "@/pages/admin/shipping";
import AdminUsers from "@/pages/admin/users";
import AdminSettings from "@/pages/admin/settings";
import AuthPage from "@/pages/auth-page";
import ForgotPassword from "@/pages/forgot-password";

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isPortugal, isInternational, isLoading: locationLoading } = useLocationContext();

  // Wait for location detection first
  if (locationLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </PublicLayout>
    );
  }

  // International users can access immediately without auth
  if (isInternational) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // Portugal users need auth - wait for auth check
  if (isPortugal) {
    if (authLoading) {
      return (
        <PublicLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-muted-foreground">A carregar...</div>
          </div>
        </PublicLayout>
      );
    }

    if (!isAuthenticated) {
      window.location.href = "/login";
      return null;
    }
  }

  return <PublicLayout>{children}</PublicLayout>;
}

function ApprovedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, isPending, isRejected, isApproved } = useAuth();
  const { isPortugal, isInternational, isLoading: locationLoading } = useLocationContext();

  // Wait for location detection first
  if (locationLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </PublicLayout>
    );
  }

  // International users can access immediately without auth
  if (isInternational) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  if (isPortugal) {
    if (authLoading) {
      return (
        <PublicLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-muted-foreground">A carregar...</div>
          </div>
        </PublicLayout>
      );
    }

    if (!isAuthenticated) {
      window.location.href = "/login";
      return null;
    }

    if (!isApproved) {
      if (isPending) {
        return (
          <PublicLayout>
            <PendingApproval />
          </PublicLayout>
        );
      }

      if (isRejected) {
        return (
          <PublicLayout>
            <div className="min-h-[60vh] flex items-center justify-center p-4">
              <div className="max-w-md w-full">
                <div className="rounded-lg border bg-background p-6 text-center">
                  <h1 className="text-2xl font-semibold text-destructive">Acesso Negado</h1>
                  <p className="text-muted-foreground mt-2">
                    Infelizmente o seu pedido de acesso não foi aprovado. Por favor contacte-nos para mais informações.
                  </p>
                  <div className="mt-5">
                    <a
                      href="mailto:geral@cara.com.pt"
                      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                    >
                      Contactar Suporte
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </PublicLayout>
        );
      }

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
        <Route path="/admin/usuarios" component={() => (
          <AdminRoute><AdminUsers /></AdminRoute>
        )} />
        <Route path="/admin/paypal" component={() => (
          <AdminRoute><AdminPaypal /></AdminRoute>
        )} />
        <Route path="/admin/frete" component={() => (
          <AdminRoute><AdminShipping /></AdminRoute>
        )} />
        <Route path="/admin/configuracoes" component={() => (
          <AdminRoute><AdminSettings /></AdminRoute>
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
      <Route path="/recuperar-senha" component={() => (
        <PublicLayout><ForgotPassword /></PublicLayout>
      )} />
      <Route path="/inicio" component={() => (
        <AuthRoute><Home /></AuthRoute>
      )} />
      <Route path="/produtos" component={() => (
        <ApprovedRoute><Products /></ApprovedRoute>
      )} />
      <Route path="/produto/:slug" component={() => (
        <ApprovedRoute><ProductDetail /></ApprovedRoute>
      )} />
      <Route path="/carrinho" component={() => (
        <ApprovedRoute><Cart /></ApprovedRoute>
      )} />
      <Route path="/checkout" component={() => (
        <ApprovedRoute><Checkout /></ApprovedRoute>
      )} />
      <Route path="/minha-conta" component={() => (
        <ApprovedRoute><Account /></ApprovedRoute>
      )} />
      <Route path="/meus-pedidos" component={() => (
        <ApprovedRoute><Orders /></ApprovedRoute>
      )} />
      <Route path="/pedido/:id" component={() => (
        <ApprovedRoute><OrderConfirmation /></ApprovedRoute>
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
            <LanguageProvider>
              <GuestCartProvider>
                <Router />
                <Toaster />
              </GuestCartProvider>
            </LanguageProvider>
          </LocationProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
