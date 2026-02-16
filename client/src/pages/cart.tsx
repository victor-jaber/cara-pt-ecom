import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateItemPrice, getApplicablePromotionRule } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck,
  Tag, ShieldCheck, Clock, CreditCard, Sparkles, ChevronRight,
  Package, CheckCircle2, X
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { CartItemWithProduct, ShippingOption } from "@shared/schema";
import { useLocationContext } from "@/contexts/LocationContext";
import { useGuestCart, type GuestCartItem } from "@/contexts/GuestCartContext";

// Free shipping threshold
const FREE_SHIPPING_THRESHOLD = 50;

export default function Cart() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const { isInternational } = useLocationContext();
  const { isAuthenticated } = useAuth();
  const guestCart = useGuestCart();

  const shouldUseGuestCart = isInternational;

  const { data: apiCartItems = [], isLoading: isLoadingApiCart } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: !shouldUseGuestCart && isAuthenticated,
  });

  const { data: shippingOptions = [], isLoading: isLoadingShipping } = useQuery<ShippingOption[]>({
    queryKey: ["/api/shipping-options"],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await apiRequest("PATCH", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Produto removido",
        description: "O produto foi removido do carrinho.",
      });
      setRemovingItem(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o produto.",
        variant: "destructive",
      });
      setRemovingItem(null);
    },
  });

  const isLoading = shouldUseGuestCart ? false : isLoadingApiCart;

  const cartItems: CartItemWithProduct[] = shouldUseGuestCart
    ? guestCart.items.map((item: GuestCartItem) => ({
        id: item.id,
        userId: "guest",
        productId: item.product.id,
        quantity: item.quantity,
        createdAt: null,
        product: item.product,
      }))
    : apiCartItems;

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (shouldUseGuestCart) {
      guestCart.updateQuantity(id, quantity);
    } else {
      updateQuantityMutation.mutate({ id, quantity });
    }
  };

  const handleRemoveItem = (id: string) => {
    setRemovingItem(id);
    if (shouldUseGuestCart) {
      guestCart.removeItem(id);
      toast({
        title: "Produto removido",
        description: "O produto foi removido do carrinho.",
      });
      setRemovingItem(null);
    } else {
      removeItemMutation.mutate(id);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce(
    (acc, item) => acc + calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules),
    0
  );

  const regularTotal = cartItems.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0
  );

  const totalSavings = regularTotal - subtotal;

  const selectedShipping = shippingOptions.find(opt => opt.id === selectedShippingId);
  const shippingCost = selectedShipping ? Number(selectedShipping.price) : 0;
  const total = subtotal + shippingCost;

  // Progress to free shipping
  const progressToFreeShipping = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  // Auto-select first shipping option if none selected
  useEffect(() => {
    if (shippingOptions.length > 0 && !selectedShippingId) {
      setSelectedShippingId(shippingOptions[0].id);
    }
  }, [shippingOptions, selectedShippingId]);

  if (isLoading || isLoadingShipping) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Progress Steps Skeleton */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-28 h-28 rounded-xl" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <ShoppingCart className="h-4 w-4" />
              <span>Carrinho</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium text-sm">
              <CreditCard className="h-4 w-4" />
              <span>Checkout</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirmado</span>
            </div>
          </div>

          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-12 text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
                  <div className="relative bg-background/80 backdrop-blur-sm p-6 rounded-full">
                    <ShoppingBag className="h-16 w-16 text-primary/60" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">O seu carrinho está vazio</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Descubra os nossos produtos premium e aproveite ofertas exclusivas!
                </p>
                <Link href="/produtos">
                  <Button size="lg" className="gap-2 px-8 rounded-full shadow-lg hover:shadow-xl transition-all">
                    <Sparkles className="h-4 w-4" />
                    Explorar Produtos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground text-center">Envio Rápido</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground text-center">Pagamento Seguro</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground text-center">Qualidade Premium</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md">
            <ShoppingCart className="h-4 w-4" />
            <span>Carrinho</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium text-sm">
            <CreditCard className="h-4 w-4" />
            <span>Checkout</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Confirmado</span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">O Seu Carrinho</h1>
            <p className="text-muted-foreground mt-1">
              {cartItems.length} {cartItems.length === 1 ? "produto" : "produtos"} no carrinho
            </p>
          </div>
          <Link href="/produtos">
            <Button variant="outline" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Continuar Comprando
            </Button>
          </Link>
        </div>

        {/* Free Shipping Progress */}
        {remainingForFreeShipping > 0 && (
          <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    Faltam apenas <span className="text-primary font-bold">{remainingForFreeShipping.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</span> para o envio grátis!
                  </p>
                  <div className="mt-2 h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Savings Banner */}
        {totalSavings > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-500/20">
                <Tag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                Parabéns! Está a poupar <span className="font-bold">{totalSavings.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</span> com as nossas ofertas!
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => {
              const appliedRule = getApplicablePromotionRule(item.quantity, item.product.promotionRules);
              const itemTotal = calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules);
              const itemRegularTotal = Number(item.product.price) * item.quantity;
              const hasDiscount = appliedRule && itemTotal < itemRegularTotal;
              const discountPercentage = hasDiscount
                ? Math.round((1 - itemTotal / itemRegularTotal) * 100)
                : 0;

              return (
                <Card
                  key={item.id}
                  className={`group border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-up ${
                    removingItem === item.id ? 'opacity-50 scale-95' : ''
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`cart-item-${item.id}`}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Product Image */}
                      <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative overflow-hidden">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground/30">CARA</span>
                        )}
                        {hasDiscount && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold shadow-md">
                              -{discountPercentage}%
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 p-4 md:p-5 flex flex-col">
                        <div className="flex justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <Link href={`/produto/${item.product.slug}`}>
                              <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                                {item.product.name}
                              </h3>
                            </Link>
                            {item.product.particleSize && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Partícula: {item.product.particleSize}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={!shouldUseGuestCart && removeItemMutation.isPending}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex-1" />

                        <div className="flex items-end justify-between gap-4 mt-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-background"
                              onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1 || (!shouldUseGuestCart && updateQuantityMutation.isPending)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-12 h-8 text-center text-sm font-medium border-0 bg-transparent focus-visible:ring-0 p-0"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-background"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={!shouldUseGuestCart && updateQuantityMutation.isPending}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            {hasDiscount && (
                              <p className="text-sm text-muted-foreground line-through mb-0.5">
                                {itemRegularTotal.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                              </p>
                            )}
                            <p className="text-xl font-bold text-primary">
                              {itemTotal.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                            </p>
                            {hasDiscount && appliedRule && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                                <Tag className="h-3 w-3 mr-1" />
                                {parseFloat(appliedRule.pricePerUnit).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}/un
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    Subtotal ({cartItems.length} {cartItems.length === 1 ? "produto" : "produtos"})
                  </span>
                  <span className="font-medium">
                    {subtotal.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                  </span>
                </div>

                {/* Discount */}
                {totalSavings > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      Poupança
                    </span>
                    <span className="font-medium">
                      -{totalSavings.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                    </span>
                  </div>
                )}

                {shippingOptions.length > 0 && (
                  <>
                    <Separator />
                    {/* Shipping Options */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Truck className="h-4 w-4 text-primary" />
                        <span>Opção de Envio</span>
                      </div>
                      <RadioGroup
                        value={selectedShippingId}
                        onValueChange={setSelectedShippingId}
                        className="space-y-2"
                        data-testid="cart-shipping-options"
                      >
                        {shippingOptions.map((option) => (
                          <div
                            key={option.id}
                            className={`relative flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              selectedShippingId === option.id
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/30 hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedShippingId(option.id)}
                          >
                            <RadioGroupItem
                              value={option.id}
                              id={`cart-shipping-${option.id}`}
                              data-testid={`cart-radio-shipping-${option.id}`}
                              className="data-[state=checked]:border-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor={`cart-shipping-${option.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {option.name}
                              </Label>
                              {option.estimatedDays && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {option.estimatedDays}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-sm">
                              {Number(option.price) === 0 ? (
                                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                                  Grátis
                                </Badge>
                              ) : (
                                Number(option.price).toLocaleString("pt-PT", {
                                  style: "currency",
                                  currency: "EUR",
                                })
                              )}
                            </span>
                          </div>
                        ))}
                      </RadioGroup>
                      {!selectedShippingId && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <X className="h-3 w-3" />
                          Selecione uma opção de envio
                        </p>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Shipping Cost */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Envio</span>
                  <span className="font-medium" data-testid="cart-shipping-cost">
                    {shippingOptions.length === 0 ? (
                      <span className="text-muted-foreground">-</span>
                    ) : !selectedShippingId ? (
                      <span className="text-muted-foreground">Selecione opção</span>
                    ) : shippingCost === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Grátis</span>
                    ) : (
                      shippingCost.toLocaleString("pt-PT", {
                        style: "currency",
                        currency: "EUR",
                      })
                    )}
                  </span>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary" data-testid="cart-total">
                    {total.toLocaleString("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                  disabled={shippingOptions.length > 0 && !selectedShippingId}
                  onClick={() => {
                    if (shippingOptions.length > 0 && !selectedShippingId) {
                      toast({
                        title: "Selecione uma opção de envio",
                        description: "Por favor escolha uma opção de envio para continuar.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setLocation(selectedShippingId ? `/checkout?shipping=${selectedShippingId}` : "/checkout");
                  }}
                  data-testid="button-checkout"
                >
                  Finalizar Compra
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                {/* Payment Methods */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Pagamento 100% Seguro</span>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Envio Rápido</span>
                    <span className="text-xs text-muted-foreground">2-5 dias</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="p-2 rounded-full bg-primary/10">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Seguro</span>
                    <span className="text-xs text-muted-foreground">SSL</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium">Devolução</span>
                    <span className="text-xs text-muted-foreground">14 dias</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}