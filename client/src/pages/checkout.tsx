import { useEffect, useState } from "react";
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
import { StripePayment } from "@/components/stripe-payment";
import { EupagoPayment } from "@/components/eupago-payment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const shippingFromUrl = urlParams.get("shipping") || "";
  const [selectedShippingId, setSelectedShippingId] = useState<string>(shippingFromUrl);
  const { isInternational, isPortugal, countryCode, region } = useLocationContext();
  const guestCart = useGuestCart();

  const { data: paymentSetup } = useQuery<{
    paypal: { enabled: boolean; clientId: string | null; mode: "sandbox" | "live" };
    stripe: { enabled: boolean; publishableKey: string | null; mode: "test" | "live" };
    eupago: { enabled: boolean; mode: "sandbox" | "live" };
  }>({
    queryKey: ["/api/payment-methods/setup"],
  });

  type PaymentChoice = "paypal" | "stripe" | "eupago_multibanco" | "eupago_mbway";
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice | "">("");

  // International users must register/login to checkout (they get auto-approved)
  const needsAuth = isInternational && !isAuthenticated;

  // International users always use guest cart (localStorage) for reliability
  // Portugal users use API cart (requires authentication)
  const useGuestCartItems = isInternational;

  const { data: apiCartItems = [], isLoading: isLoadingApiCart } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: !isInternational && isAuthenticated,
  });

  const isLoading = useGuestCartItems ? false : isLoadingApiCart;

  const cartItems: CartItemWithProduct[] = useGuestCartItems
    ? guestCart.items.map((item: GuestCartItem) => ({
      id: item.id,
      userId: "guest",
      productId: item.product.id,
      quantity: item.quantity,
      createdAt: null,
      product: item.product,
    }))
    : apiCartItems;

  const eupagoItems = useGuestCartItems
    ? cartItems.map((item) => ({ productId: item.productId || item.product.id, quantity: item.quantity }))
    : undefined;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules),
    0,
  );

  const shippingOptionsUrl = `/api/shipping-options?countryCode=${encodeURIComponent(countryCode || "")}&region=${encodeURIComponent(region || "")}&subtotal=${encodeURIComponent(subtotal.toFixed(2))}`;

  const { data: shippingOptions = [], isLoading: isLoadingShipping } = useQuery<ShippingOption[]>({
    queryKey: [shippingOptionsUrl],
  });

  const allPaymentChoices: Array<{ value: PaymentChoice; label: string; enabled: boolean }> = [
    { value: "paypal", label: "PayPal", enabled: !!paymentSetup?.paypal?.enabled },
    { value: "stripe", label: "Stripe (Cartão)", enabled: !!paymentSetup?.stripe?.enabled },
    {
      value: "eupago_multibanco",
      label: "EuPago - Multibanco",
      enabled:
        !!paymentSetup?.eupago?.enabled &&
        (["PT", "BR"].includes((countryCode || "").toUpperCase()) || isPortugal),
    },
    {
      value: "eupago_mbway",
      label: "EuPago - MBWay",
      enabled:
        !!paymentSetup?.eupago?.enabled &&
        (["PT", "BR"].includes((countryCode || "").toUpperCase()) || isPortugal),
    },
  ];

  const availablePaymentChoices = allPaymentChoices.filter((c) => c.enabled);

  useEffect(() => {
    // Don't auto-select a payment method; user must choose explicitly.
    // But if the currently selected method becomes unavailable (e.g. settings changed), clear it.
    if (!paymentChoice) return;
    if (availablePaymentChoices.some((c) => c.value === paymentChoice)) return;
    setPaymentChoice("");
  }, [paymentSetup?.paypal?.enabled, paymentSetup?.stripe?.enabled, paymentSetup?.eupago?.enabled, countryCode, paymentChoice]);

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
      // International users use the international-orders endpoint with cart items in request
      if (isInternational && user) {
        const orderItems = cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules) / item.quantity,
        }));

        const response = await apiRequest("POST", "/api/international-orders", {
          userId: user.id,
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          shippingOptionId: selectedShippingId || undefined,
          countryCode,
          region,
          items: orderItems,
        });
        return response;
      }

      // Portugal users use the regular orders endpoint (session-based)
      const response = await apiRequest("POST", "/api/orders", {
        ...data,
        shippingOptionId: selectedShippingId || undefined,
        countryCode,
        region,
      });
      return response;
    },
    onSuccess: () => {
      // Clear guest cart for international users
      if (isInternational) {
        guestCart.clearCart();
      }
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
        countryCode,
        region,
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

  // All users must be authenticated now, so only use the regular form validation
  const isFormValid = form.watch("shippingAddress")?.length >= 10 &&
    (shippingOptions.length === 0 || selectedShippingId);

  const canPay = isFormValid && !!paymentChoice;

  const isPending = createOrderMutation.isPending;

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

  if (needsAuth) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/carrinho">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Carrinho
          </Button>
        </Link>

        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Criar Conta para Finalizar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Para finalizar a sua compra, é necessário criar uma conta ou fazer login.
            </p>
            <p className="text-sm text-muted-foreground">
              Clientes internacionais são aprovados automaticamente.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Link href="/login?tab=register&redirect=/checkout">
                <Button className="w-full" data-testid="button-register-checkout">
                  Criar Conta
                </Button>
              </Link>
              <Link href="/login?redirect=/checkout">
                <Button variant="outline" className="w-full" data-testid="button-login-checkout">
                  Já tenho conta - Entrar
                </Button>
              </Link>
            </div>
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
                  className={`flex items-start gap-3 p-4 rounded-md border cursor-pointer transition-colors ${selectedShippingId === option.id
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
        <div className="w-full space-y-3">
          <div className="text-sm font-medium">Método de pagamento</div>

          <div className="grid grid-cols-1 gap-3">
            {availablePaymentChoices.map((choice) => {
              const isSelected = paymentChoice === choice.value;

              // Map payment methods to icons and descriptions
              const methodInfo: Record<string, { icon: string; description: string }> = {
                paypal: { icon: "💳", description: "Pague com PayPal ou cartão" },
                stripe: { icon: "💳", description: "Pague com cartão de crédito" },
                eupago_multibanco: { icon: "🏦", description: "Referência Multibanco" },
                eupago_mbway: { icon: "📱", description: "Pagamento instantâneo MB WAY" },
              };

              const info = methodInfo[choice.value] || { icon: "💰", description: "" };

              return (
                <div
                  key={choice.value}
                  onClick={() => setPaymentChoice(choice.value)}
                  className={`
                    relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                    hover:scale-[1.02] hover:shadow-md
                    ${isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-primary/50"
                    }
                  `}
                  data-testid={`payment-card-${choice.value}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{info.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{choice.label}</div>
                      {info.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">{info.description}</div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>


          {paymentChoice === "paypal" && (
            <PayPalButton
              cart={cartItems.map((item) => {
                const unitPrice =
                  calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules) / item.quantity;
                return {
                  price: unitPrice,
                  quantity: item.quantity,
                  name: item.product.name,
                };
              })}
              shippingAddress={form.watch("shippingAddress")}
              notes={form.watch("notes") || ""}
              shippingOptionId={selectedShippingId || undefined}
              countryCode={countryCode}
              region={region}
              disabled={!canPay}
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
          )}

          {paymentChoice === "stripe" && paymentSetup?.stripe?.publishableKey && (
            <StripePayment
              publishableKey={paymentSetup.stripe.publishableKey}
              shippingAddress={form.watch("shippingAddress")}
              notes={form.watch("notes") || ""}
              shippingOptionId={selectedShippingId || undefined}
              countryCode={countryCode}
              region={region}
              items={
                useGuestCartItems
                  ? cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
                  : undefined
              }
              disabled={!canPay}
              onSuccess={(details) => {
                if (isInternational) {
                  guestCart.clearCart();
                }
                queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                toast({
                  title: "Pagamento realizado com sucesso",
                  description: `Pedido confirmado via Stripe. ID: ${details.paymentIntentId}`,
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
          )}

          {paymentChoice === "eupago_multibanco" && (
            <EupagoPayment
              method="multibanco"
              shippingAddress={form.watch("shippingAddress")}
              notes={form.watch("notes") || ""}
              shippingOptionId={selectedShippingId || undefined}
              countryCode={countryCode}
              region={region}
              items={eupagoItems}
              disabled={!canPay}
              onSuccess={(details) => {
                if (isInternational) {
                  guestCart.clearCart();
                }
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                toast({
                  title: "Pedido criado",
                  description: "Referência Multibanco gerada. Conclua o pagamento para confirmar.",
                });
                setLocation(`/pedido/${details.orderId}`);
              }}
              onError={(error) => {
                toast({
                  title: "Erro no pagamento",
                  description: error.message || "Não foi possível processar o pedido.",
                  variant: "destructive",
                });
              }}
            />
          )}

          {paymentChoice === "eupago_mbway" && (
            <EupagoPayment
              method="mbway"
              shippingAddress={form.watch("shippingAddress")}
              notes={form.watch("notes") || ""}
              shippingOptionId={selectedShippingId || undefined}
              countryCode={countryCode}
              region={region}
              items={eupagoItems}
              disabled={!canPay}
              onSuccess={(details) => {
                if (isInternational) {
                  guestCart.clearCart();
                }
                queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                toast({
                  title: "✅ Pedido criado com sucesso!",
                  description: "🚨 Abra o app MB WAY AGORA e confirme o pagamento. Tem apenas 5 minutos!",
                  duration: 8000,
                });
                setLocation(`/pedido/${details.orderId}`);
              }}
              onError={(error) => {
                toast({
                  title: "Erro no pagamento",
                  description: error.message || "Não foi possível processar o pedido.",
                  variant: "destructive",
                });
              }}
            />
          )}
        </div>
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
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                <div className="space-y-3">
                  <div className="text-sm font-medium">Método de pagamento</div>

                  <div className="grid grid-cols-1 gap-3">
                    {availablePaymentChoices.map((choice) => {
                      const isSelected = paymentChoice === choice.value;

                      // Map payment methods to icons and descriptions
                      const methodInfo: Record<string, { icon: string; description: string }> = {
                        paypal: { icon: "💳", description: "Pague com PayPal ou cartão" },
                        stripe: { icon: "💳", description: "Pague com cartão de crédito" },
                        eupago_multibanco: { icon: "🏦", description: "Referência Multibanco" },
                        eupago_mbway: { icon: "📱", description: "Pagamento instantâneo MB WAY" },
                      };

                      const info = methodInfo[choice.value] || { icon: "💰", description: "" };

                      return (
                        <div
                          key={choice.value}
                          onClick={() => setPaymentChoice(choice.value)}
                          className={`
                            relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                            active:scale-[0.98]
                            ${isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border bg-background"
                            }
                          `}
                          data-testid={`payment-card-mobile-${choice.value}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{info.icon}</div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{choice.label}</div>
                              {info.description && (
                                <div className="text-xs text-muted-foreground mt-0.5">{info.description}</div>
                              )}
                            </div>
                            {isSelected && (
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="w-4 h-4"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {paymentChoice === "paypal" && (
                    <PayPalButton
                      cart={cartItems.map((item) => {
                        const unitPrice =
                          calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules) /
                          item.quantity;
                        return {
                          price: unitPrice,
                          quantity: item.quantity,
                          name: item.product.name,
                        };
                      })}
                      shippingAddress={form.watch("shippingAddress")}
                      notes={form.watch("notes") || ""}
                      shippingOptionId={selectedShippingId || undefined}
                      countryCode={countryCode}
                      region={region}
                      disabled={!canPay}
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
                  )}

                  {paymentChoice === "stripe" && paymentSetup?.stripe?.publishableKey && (
                    <StripePayment
                      publishableKey={paymentSetup.stripe.publishableKey}
                      shippingAddress={form.watch("shippingAddress")}
                      notes={form.watch("notes") || ""}
                      shippingOptionId={selectedShippingId || undefined}
                      countryCode={countryCode}
                      region={region}
                      items={
                        useGuestCartItems
                          ? cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
                          : undefined
                      }
                      disabled={!canPay}
                      onSuccess={(details) => {
                        if (isInternational) {
                          guestCart.clearCart();
                        }
                        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                        toast({
                          title: "Pagamento realizado com sucesso",
                          description: `Pedido confirmado via Stripe. ID: ${details.paymentIntentId}`,
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
                  )}

                  {paymentChoice === "eupago_multibanco" && (
                    <EupagoPayment
                      method="multibanco"
                      shippingAddress={form.watch("shippingAddress")}
                      notes={form.watch("notes") || ""}
                      shippingOptionId={selectedShippingId || undefined}
                      countryCode={countryCode}
                      region={region}
                      items={eupagoItems}
                      disabled={!canPay}
                      onSuccess={(details) => {
                        if (isInternational) {
                          guestCart.clearCart();
                        }
                        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                        toast({
                          title: "Pedido criado",
                          description: "Referência Multibanco gerada. Conclua o pagamento para confirmar.",
                        });
                        setLocation(`/pedido/${details.orderId}`);
                      }}
                      onError={(error) => {
                        toast({
                          title: "Erro no pagamento",
                          description: error.message || "Não foi possível processar o pedido.",
                          variant: "destructive",
                        });
                      }}
                    />
                  )}

                  {paymentChoice === "eupago_mbway" && (
                    <EupagoPayment
                      method="mbway"
                      shippingAddress={form.watch("shippingAddress")}
                      notes={form.watch("notes") || ""}
                      shippingOptionId={selectedShippingId || undefined}
                      countryCode={countryCode}
                      region={region}
                      items={eupagoItems}
                      disabled={!canPay}
                      onSuccess={(details) => {
                        if (isInternational) {
                          guestCart.clearCart();
                        }
                        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                        toast({
                          title: "✅ Pedido criado com sucesso!",
                          description: "🚨 Abra o app MB WAY AGORA e confirme o pagamento. Tem apenas 5 minutos!",
                          duration: 8000,
                        });
                        setLocation(`/pedido/${details.orderId}`);
                      }}
                      onError={(error) => {
                        toast({
                          title: "Erro no pagamento",
                          description: error.message || "Não foi possível processar o pedido.",
                          variant: "destructive",
                        });
                      }}
                    />
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>

        <div>
          <OrderSummaryCard />
        </div>
      </div>
    </div>
  );
}
