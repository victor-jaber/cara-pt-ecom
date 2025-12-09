import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateItemPrice, getApplicablePromotionRule } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShoppingCart, ArrowLeft, CheckCircle2, Loader2, Truck, Tag } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import type { CartItemWithProduct, ShippingOption } from "@shared/schema";
import { PayPalButton } from "@/components/paypal-button";
import { useLocationContext } from "@/contexts/LocationContext";
import { useGuestCart, type GuestCartItem } from "@/contexts/GuestCartContext";

const checkoutSchema = z.object({
  shippingAddress: z.string().min(10, "Por favor insira um endereço de envio completo"),
  notes: z.string().optional(),
});

const guestCheckoutSchema = z.object({
  guestName: z.string().min(2, "Por favor insira o seu nome"),
  guestEmail: z.string().email("Por favor insira um email válido"),
  guestPhone: z.string().min(9, "Por favor insira um número de telefone válido"),
  shippingAddress: z.string().min(10, "Por favor insira um endereço de envio completo"),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;
type GuestCheckoutForm = z.infer<typeof guestCheckoutSchema>;

export default function Checkout() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const shippingFromUrl = urlParams.get("shipping") || "";
  const [selectedShippingId, setSelectedShippingId] = useState<string>(shippingFromUrl);
  const { isInternational } = useLocationContext();
  const guestCart = useGuestCart();

  const isGuestCheckout = isInternational;

  const { data: apiCartItems = [], isLoading: isLoadingApiCart } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: !isGuestCheckout,
  });

  const { data: shippingOptions = [], isLoading: isLoadingShipping } = useQuery<ShippingOption[]>({
    queryKey: ["/api/shipping-options"],
  });

  const isLoading = isGuestCheckout ? false : isLoadingApiCart;

  const cartItems: CartItemWithProduct[] = isGuestCheckout
    ? guestCart.items.map((item: GuestCartItem) => ({
        id: item.id,
        userId: "guest",
        productId: item.product.id,
        quantity: item.quantity,
        createdAt: null,
        product: item.product,
      }))
    : apiCartItems;

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingAddress: user?.clinicAddress || "",
      notes: "",
    },
  });

  const guestForm = useForm<GuestCheckoutForm>({
    resolver: zodResolver(guestCheckoutSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      shippingAddress: "",
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      const response = await apiRequest("POST", "/api/orders", {
        ...data,
        shippingOptionId: selectedShippingId || undefined,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Pedido criado com sucesso",
        description: "Receberá um email com os detalhes do pedido.",
      });
      setLocation("/meus-pedidos");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o pedido. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createGuestOrderMutation = useMutation({
    mutationFn: async (data: GuestCheckoutForm) => {
      const orderItems = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules) / item.quantity,
      }));
      
      const response = await apiRequest("POST", "/api/guest-orders", {
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        shippingAddress: data.shippingAddress,
        notes: data.notes,
        shippingOptionId: selectedShippingId || undefined,
        items: orderItems,
      });
      return response;
    },
    onSuccess: () => {
      guestCart.clearCart();
      toast({
        title: "Pedido criado com sucesso",
        description: "Receberá um email com os detalhes do pedido.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o pedido. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const subtotal = cartItems.reduce(
    (acc, item) => acc + calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules),
    0
  );

  const selectedShipping = shippingOptions.find(opt => opt.id === selectedShippingId);
  const shippingCost = selectedShipping ? Number(selectedShipping.price) : 0;
  const total = subtotal + shippingCost;

  const onSubmit = (data: CheckoutForm) => {
    if (shippingOptions.length > 0 && !selectedShippingId) {
      toast({
        title: "Selecione uma opção de envio",
        description: "Por favor escolha uma opção de envio para continuar.",
        variant: "destructive",
      });
      return;
    }
    createOrderMutation.mutate(data);
  };

  const onGuestSubmit = (data: GuestCheckoutForm) => {
    if (shippingOptions.length > 0 && !selectedShippingId) {
      toast({
        title: "Selecione uma opção de envio",
        description: "Por favor escolha uma opção de envio para continuar.",
        variant: "destructive",
      });
      return;
    }
    createGuestOrderMutation.mutate(data);
  };

  const isFormValid = isGuestCheckout
    ? guestForm.watch("guestName")?.length >= 2 &&
      guestForm.watch("guestEmail")?.includes("@") &&
      guestForm.watch("guestPhone")?.length >= 9 &&
      guestForm.watch("shippingAddress")?.length >= 10 &&
      (shippingOptions.length === 0 || selectedShippingId)
    : form.watch("shippingAddress")?.length >= 10 && 
      (shippingOptions.length === 0 || selectedShippingId);

  const isPending = isGuestCheckout ? createGuestOrderMutation.isPending : createOrderMutation.isPending;

  if (isLoading || isLoadingShipping) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">O seu carrinho está vazio</h3>
            <p className="text-muted-foreground mt-1">
              Adicione produtos antes de finalizar a compra.
            </p>
            <Link href="/produtos">
              <Button className="mt-4">Ver Produtos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ShippingOptionsSection = () => (
    <>
      {shippingOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Opção de Envio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedShippingId}
              onValueChange={setSelectedShippingId}
              className="space-y-3"
              data-testid="shipping-options-group"
            >
              {shippingOptions.map((option) => (
                <div
                  key={option.id}
                  className={`flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-colors ${
                    selectedShippingId === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                  onClick={() => setSelectedShippingId(option.id)}
                >
                  <RadioGroupItem
                    value={option.id}
                    id={`shipping-${option.id}`}
                    className="mt-0.5"
                    data-testid={`radio-shipping-${option.id}`}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`shipping-${option.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {option.name}
                    </Label>
                    {option.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {option.description}
                      </p>
                    )}
                    {option.estimatedDays && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Entrega estimada: {option.estimatedDays} dias úteis
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">
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
                </div>
              ))}
            </RadioGroup>
            {!selectedShippingId && (
              <p className="text-sm text-destructive mt-3">
                Por favor selecione uma opção de envio
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );

  const ProductsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Produtos ({cartItems.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cartItems.map((item) => {
          const applicableRule = getApplicablePromotionRule(item.quantity, item.product.promotionRules);
          const originalTotal = Number(item.product.price) * item.quantity;
          const discountedTotal = calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules);
          const hasDiscount = applicableRule !== null;
          
          return (
            <div key={item.id} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  {item.product.image ? (
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{item.product.name}</p>
                    {hasDiscount && (
                      <Badge variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        Promo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                {hasDiscount ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs text-muted-foreground line-through">
                      {originalTotal.toLocaleString("pt-PT", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {discountedTotal.toLocaleString("pt-PT", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                ) : (
                  <p className="font-medium">
                    {originalTotal.toLocaleString("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  const OrderSummaryCard = () => (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Resumo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>
            {subtotal.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Envio</span>
          <span data-testid="text-shipping-cost">
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
        {selectedShipping && (
          <p className="text-xs text-muted-foreground">
            {selectedShipping.name}
            {selectedShipping.estimatedDays && ` - ${selectedShipping.estimatedDays} dias úteis`}
          </p>
        )}
        <Separator />
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span data-testid="text-order-total">
            {total.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
        </div>
      </CardContent>
      <CardFooter className="hidden lg:flex lg:flex-col lg:gap-4">
        <Button
          className="w-full"
          size="lg"
          onClick={isGuestCheckout ? guestForm.handleSubmit(onGuestSubmit) : form.handleSubmit(onSubmit)}
          disabled={isPending || !isFormValid}
          data-testid="button-submit-order"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A processar...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar Pedido
            </>
          )}
        </Button>
        
        {!isGuestCheckout && (
          <div className="w-full">
            <div className="relative flex items-center justify-center my-2">
              <Separator className="flex-1" />
              <span className="px-3 text-xs text-muted-foreground bg-card">ou pague com</span>
              <Separator className="flex-1" />
            </div>
            <PayPalButton
              cart={cartItems.map(item => {
                const unitPrice = calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules) / item.quantity;
                return {
                  price: unitPrice,
                  quantity: item.quantity,
                  name: item.product.name,
                };
              })}
              shippingAddress={form.watch("shippingAddress")}
              notes={form.watch("notes") || ""}
              shippingOptionId={selectedShippingId || undefined}
              disabled={!isFormValid}
              onSuccess={(details) => {
                queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                toast({
                  title: "Pagamento realizado com sucesso",
                  description: `Pedido confirmado via PayPal. ID: ${details.paypalOrderId}`,
                });
                setLocation("/meus-pedidos");
              }}
              onError={(error) => {
                toast({
                  title: "Erro no pagamento",
                  description: error.message || "Não foi possível processar o pagamento.",
                  variant: "destructive",
                });
              }}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/carrinho">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-cart">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Carrinho
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isGuestCheckout ? (
            <Form {...guestForm}>
              <form onSubmit={guestForm.handleSubmit(onGuestSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados de Envio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={guestForm.control}
                        name="guestName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="O seu nome completo"
                                {...field}
                                data-testid="input-guest-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={guestForm.control}
                        name="guestEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="seu@email.com"
                                {...field}
                                data-testid="input-guest-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={guestForm.control}
                      name="guestPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+351 912 345 678"
                              {...field}
                              data-testid="input-guest-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={guestForm.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço de Envio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Rua, número, código postal, cidade, país..."
                              {...field}
                              data-testid="input-shipping-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={guestForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Instruções especiais de entrega..."
                              {...field}
                              data-testid="input-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <ShippingOptionsSection />
                <ProductsSection />

                <div className="lg:hidden space-y-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={createGuestOrderMutation.isPending || !isFormValid}
                    data-testid="button-submit-order-mobile"
                  >
                    {createGuestOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A processar...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirmar Pedido
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados de Envio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Nome</label>
                        <Input
                          value={`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "-"}
                          disabled
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input value={user?.email || "-"} disabled className="mt-1" />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço de Envio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Rua, número, código postal, cidade..."
                              {...field}
                              data-testid="input-shipping-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Instruções especiais de entrega..."
                              {...field}
                              data-testid="input-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <ShippingOptionsSection />
                <ProductsSection />

                <div className="lg:hidden space-y-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={createOrderMutation.isPending || !isFormValid}
                    data-testid="button-submit-order-mobile"
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A processar...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirmar Pedido
                      </>
                    )}
                  </Button>
                  
                  <div className="w-full">
                    <div className="relative flex items-center justify-center my-2">
                      <Separator className="flex-1" />
                      <span className="px-3 text-xs text-muted-foreground bg-background">ou pague com</span>
                      <Separator className="flex-1" />
                    </div>
                    <PayPalButton
                      cart={cartItems.map(item => {
                        const unitPrice = calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules) / item.quantity;
                        return {
                          price: unitPrice,
                          quantity: item.quantity,
                          name: item.product.name,
                        };
                      })}
                      shippingAddress={form.watch("shippingAddress")}
                      notes={form.watch("notes") || ""}
                      shippingOptionId={selectedShippingId || undefined}
                      disabled={!isFormValid}
                      onSuccess={(details) => {
                        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                        toast({
                          title: "Pagamento realizado com sucesso",
                          description: `Pedido confirmado via PayPal. ID: ${details.paypalOrderId}`,
                        });
                        setLocation("/meus-pedidos");
                      }}
                      onError={(error) => {
                        toast({
                          title: "Erro no pagamento",
                          description: error.message || "Não foi possível processar o pagamento.",
                          variant: "destructive",
                        });
                      }}
                    />
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>

        <div>
          <OrderSummaryCard />
        </div>
      </div>
    </div>
  );
}
