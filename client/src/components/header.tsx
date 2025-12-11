import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLocationContext } from "@/contexts/LocationContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Settings, 
  Package, 
  Menu,
  Home,
  FlaskConical,
  Info,
  Phone,
  Sparkles,
  Shield,
  Mail,
  MapPin,
  Heart,
  X,
  ChevronRight,
  Award
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { CartItemWithProduct } from "@shared/schema";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useState } from "react";
import { SiWhatsapp, SiInstagram, SiLinkedin } from "react-icons/si";

const WHATSAPP_NUMBER = "351910060560";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Preciso de ajuda com a loja CARA.")}`;

export function Header() {
  const { user, isAuthenticated, isApproved, isAdmin } = useAuth();
  const { isPortugal, isInternational } = useLocationContext();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const guestCart = useGuestCart();

  const canAccessProducts = isInternational || isApproved;
  
  // International users always use guest cart (localStorage) for reliability
  const shouldUseGuestCart = isInternational;

  const { data: apiCartItems = [] } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: !isInternational && isAuthenticated && canAccessProducts,
  });

  const cartCount = shouldUseGuestCart 
    ? guestCart.items.reduce((acc, item) => acc + item.quantity, 0)
    : apiCartItems.reduce((acc, item) => acc + item.quantity, 0);

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const navLinks = [
    { href: "/", label: "Início", icon: Home, requiresAccess: false },
    { href: "/produtos", label: "Produtos", icon: FlaskConical, requiresAccess: true },
    { href: "/sobre", label: "Sobre Nós", icon: Info, requiresAccess: false },
    { href: "/contacto", label: "Contacto", icon: Phone, requiresAccess: false },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 md:gap-4 px-4">
        <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
          <Link href="/" data-testid="link-home" className="flex-shrink-0">
            <img src="/logo.webp" alt="CARA" className="h-8 md:h-10" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.requiresAccess && !canAccessProducts) return null;
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isActive ? "bg-accent" : ""}
                    data-testid={`link-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-muted-foreground text-sm"
            data-testid="location-indicator"
          >
            {isPortugal ? (
              <>
                <span className="text-base leading-none">🇵🇹</span>
                <span className="hidden sm:inline">Portugal</span>
              </>
            ) : (
              <>
                <span className="text-base leading-none">🌍</span>
                <span className="hidden sm:inline">Internacional</span>
              </>
            )}
          </div>

          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {canAccessProducts && (
                <Link href="/carrinho">
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge
                        variant="default"
                        className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <Link href="/admin">
                        <DropdownMenuItem data-testid="menu-admin">
                          <Settings className="mr-2 h-4 w-4" />
                          Painel Admin
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <Link href="/minha-conta">
                    <DropdownMenuItem data-testid="menu-account">
                      <User className="mr-2 h-4 w-4" />
                      Minha Conta
                    </DropdownMenuItem>
                  </Link>
                  {isApproved && (
                    <Link href="/meus-pedidos">
                      <DropdownMenuItem data-testid="menu-orders">
                        <Package className="mr-2 h-4 w-4" />
                        Meus Pedidos
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    data-testid="menu-logout"
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.href = "/";
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : isInternational ? (
            <div className="flex items-center gap-2">
              <Link href="/carrinho">
                <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge
                      variant="default"
                      className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/login" className="hidden md:block">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Entrar
                </Button>
              </Link>
              <Link href="/login?tab=register" className="hidden md:block">
                <Button size="sm" data-testid="button-register">
                  Criar Conta
                </Button>
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Entrar
                </Button>
              </Link>
              <Link href="/login?tab=register">
                <Button size="sm" data-testid="button-register">
                  Solicitar Acesso
                </Button>
              </Link>
            </div>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 flex flex-col overflow-hidden [&>button]:hidden">
              {/* Header with gradient and logo */}
              <div className="relative bg-gradient-to-br from-primary via-primary/90 to-pink-500 px-6 py-8 text-primary-foreground">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
                <SheetClose className="absolute right-4 top-4 rounded-full bg-white/20 p-2 opacity-80 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </SheetClose>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">CARA</h2>
                        <p className="text-xs opacity-80">Preenchimento Premium</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/20 backdrop-blur text-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isPortugal ? "🇵🇹 PT" : "🌍 INT"}</span>
                    </div>
                  </div>
                  {isAuthenticated && user ? (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/20">
                      <Avatar className="h-10 w-10 border-2 border-white/30">
                        <AvatarImage src={user?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-white/20 text-primary-foreground">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs opacity-80 truncate">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                        <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20">
                          Entrar
                        </Button>
                      </Link>
                      <Link href="/login?tab=register" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                        <Button className="w-full bg-white text-primary hover:bg-white/90">
                          {isPortugal ? "Solicitar Acesso" : "Criar Conta"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <nav className="space-y-1">
                  {navLinks.map((link, index) => {
                    if (link.requiresAccess && !canAccessProducts) return null;
                    const isActive = location === link.href;
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                        <div 
                          className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            isActive 
                              ? 'bg-primary/10 text-primary' 
                              : 'hover:bg-muted'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted group-hover:bg-primary/20'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium flex-1">{link.label}</span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-primary' : 'text-muted-foreground'} group-hover:translate-x-1`} />
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* User Actions */}
                {isAuthenticated && (
                  <div className="mt-6 pt-6 border-t space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">Minha Conta</p>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all group">
                          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-orange-500" />
                          </div>
                          <span className="font-medium flex-1">Painel Admin</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    )}
                    <Link href="/minha-conta" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="font-medium flex-1">Minha Conta</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                    {isApproved && (
                      <Link href="/meus-pedidos" onClick={() => setMobileMenuOpen(false)}>
                        <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all group">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-purple-500" />
                          </div>
                          <span className="font-medium flex-1">Meus Pedidos</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    )}
                    <button 
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        setMobileMenuOpen(false);
                        window.location.href = "/";
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-red-500" />
                      </div>
                      <span className="font-medium flex-1 text-red-500">Sair</span>
                    </button>
                  </div>
                )}

                {/* Features Highlight */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-3">Porquê CARA?</p>
                  <div className="grid grid-cols-2 gap-2 px-2">
                    <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 text-center">
                      <Shield className="w-5 h-5 text-primary mb-1" />
                      <span className="text-xs font-medium">BDDE Indetectável</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-pink-500/5 to-pink-500/10 text-center">
                      <Award className="w-5 h-5 text-pink-500 mb-1" />
                      <span className="text-xs font-medium">INFARMED</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 text-center">
                      <Sparkles className="w-5 h-5 text-blue-500 mb-1" />
                      <span className="text-xs font-medium">Tech Hy-Brid</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-green-500/5 to-green-500/10 text-center">
                      <Heart className="w-5 h-5 text-green-500 mb-1" />
                      <span className="text-xs font-medium">Cruelty Free</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with contact and social */}
              <div className="border-t bg-muted/30 px-6 py-5">
                {/* WhatsApp Support */}
                <a 
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-green-500 text-white mb-4 hover:bg-green-600 transition-colors"
                >
                  <SiWhatsapp className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Suporte WhatsApp</p>
                    <p className="text-xs opacity-80">Resposta em minutos</p>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </a>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <SiInstagram className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <SiLinkedin className="w-4 h-4" />
                  </a>
                  <a href="mailto:info@cara.pt" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>

                {/* Copyright */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} CARA by GENOSS
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Distribuído por PROMIPHARM
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
