import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateItemPrice, getApplicablePromotionRule } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, Tag } from "lucide-react";
import { Link } from "wouter";
import type { CartItemWithProduct, ShippingOption } from "@shared/schema";
import { useLocationContext } from "@/contexts/LocationContext";
import { useGuestCart, type GuestCartItem } from "@/contexts/GuestCartContext";

export default function Cart() {
  const { toast } = useToast();
  const [selectedShippingId, setSelectedShippingId] = useState<string>("");
  const { isInternational } = useLocationContext();
  const { isAuthenticated } = useAuth();
  const guestCart = useGuestCart();

  // International users always use guest cart (localStorage) for reliability
  // Portugal users use API cart (requires authentication)
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
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o produto.",
        variant: "destructive",
      });
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
    if (shouldUseGuestCart) {
      guestCart.removeItem(id);
      toast({
        title: "Produto removido",
        description: "O produto foi removido do carrinho.",
      });
    } else {
      removeItemMutation.mutate(id);
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules),
    0
  );
  
  const selectedShipping = shippingOptions.find(opt => opt.id === selectedShippingId);
  const shippingCost = selectedShipping ? Number(selectedShipping.price) : 0;
  const total = subtotal + shippingCost;

  if (isLoading || isLoadingShipping) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Carrinho</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-24 h-24 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Carrinho</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">O seu carrinho está vazio</h3>
            <p className="text-muted-foreground mt-1">
              Adicione produtos para continuar com a compra.
            </p>
            <Link href="/produtos">
              <Button className="mt-4" data-testid="button-continue-shopping">
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
      <h1 className="text-3xl font-bold mb-8">Carrinho</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id} data-testid={`cart-item-${item.id}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">CARA</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link href={`/produto/${item.product.slug}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        {item.product.particleSize && (
                          <p className="text-sm text-muted-foreground">
                            Partícula: {item.product.particleSize}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={!shouldUseGuestCart && removeItemMutation.isPending}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
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
                          className="w-14 h-8 text-center text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={!shouldUseGuestCart && updateQuantityMutation.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const appliedRule = getApplicablePromotionRule(item.quantity, item.product.promotionRules);
                          const itemTotal = calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules);
                          const regularTotal = Number(item.product.price) * item.quantity;
                          const hasDiscount = appliedRule && itemTotal < regularTotal;
                          
                          return (
                            <>
                              {hasDiscount && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {regularTotal.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                                </p>
                              )}
                              <p className="font-semibold">
                                {itemTotal.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                              </p>
                              {hasDiscount && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {parseFloat(appliedRule.pricePerUnit).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}/un
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({cartItems.length} produto{cartItems.length !== 1 ? "s" : ""})</span>
                <span>
                  {subtotal.toLocaleString("pt-PT", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>
              
              {shippingOptions.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Truck className="h-4 w-4" />
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
                          className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                            selectedShippingId === option.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                          onClick={() => setSelectedShippingId(option.id)}
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`cart-shipping-${option.id}`}
                            data-testid={`cart-radio-shipping-${option.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={`cart-shipping-${option.id}`}
                              className="font-medium cursor-pointer text-sm"
                            >
                              {option.name}
                            </Label>
                            {option.estimatedDays && (
                              <p className="text-xs text-muted-foreground">
                                {option.estimatedDays}
                              </p>
                            )}
                          </div>
                          <span className="font-medium text-sm">
                            {Number(option.price) === 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">Grátis</span>
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
                      <p className="text-xs text-destructive">
                        Selecione uma opção de envio
                      </p>
                    )}
                  </div>
                </>
              )}
              
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Envio</span>
                <span data-testid="cart-shipping-cost">
                  {shippingOptions.length === 0 ? (
                    <span className="text-muted-foreground">-</span>
                  ) : !selectedShippingId ? (
                    <span className="text-muted-foreground">Selecione opção</span>
                  ) : shippingCost === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Grátis</span>
                  ) : (
                    shippingCost.toLocaleString("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    })
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span data-testid="cart-total">
                  {total.toLocaleString("pt-PT", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={selectedShippingId ? `/checkout?shipping=${selectedShippingId}` : "/checkout"} className="w-full">
                <Button 
                  className="w-full" 
                  size="lg" 
                  disabled={shippingOptions.length > 0 && !selectedShippingId}
                  data-testid="button-checkout"
                >
                  Finalizar Compra
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
