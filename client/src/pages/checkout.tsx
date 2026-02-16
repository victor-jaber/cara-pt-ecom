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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ShoppingCart, ArrowLeft, CheckCircle2, Loader2, Truck, Tag,
  CreditCard, ChevronRight, Package, ShieldCheck, Clock, User,
  Mail, MapPin, FileText, Sparkles, ShoppingBag
} from "lucide-react";
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

  const needsAuth = isInternational && !isAuthenticated;
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

  const regularTotal = cartItems.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0,
  );

  const totalSavings = regularTotal - subtotal;

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
    if (!paymentChoice) return;
    if (availablePaymentChoices.some((c) => c.value === paymentChoice)) return;
    setPaymentChoice("");
  }, [paymentSetup?.paypal?.enabled, paymentSetup?.stripe?.enabled, paymentSetup?.eupago?.enabled, countryCode, paymentChoice]);

  // Auto-select first shipping option
  useEffect(() => {
    if (shippingOptions.length > 0 && !selectedShippingId) {
      setSelectedShippingId(shippingOptions[0].id);
    }
  }, [shippingOptions, selectedShippingId]);

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

      const response = await apiRequest("POST", "/api/orders", {
        ...data,
        shippingOptionId: selectedShippingId || undefined,
        countryCode,
        region,
      });
      return response;
    },
    onSuccess: () => {
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

  const isFormValid = form.watch("shippingAddress")?.length >= 10 &&
    (shippingOptions.length === 0 || selectedShippingId);

  const canPay = isFormValid && !!paymentChoice;

  const isPending = createOrderMutation.isPending;

  if (isLoading || isLoadingShipping) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Progress Steps Skeleton */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-8 w-24 bg-muted rounded-full animate-pulse" />
                {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">A carregar checkout...</p>
            </div>
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
                  Adicione produtos antes de finalizar a compra.
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
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
              <ShoppingCart className="h-4 w-4" />
              <span>Carrinho</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md">
              <CreditCard className="h-4 w-4" />
              <span>Checkout</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirmado</span>
            </div>
          </div>

          <Link href="/carrinho" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Carrinho
          </Link>

          <Card className="max-w-md mx-auto border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardHeader className="p-0 mb-2">
                <CardTitle className="text-xl">Criar Conta para Finalizar</CardTitle>
              </CardHeader>
            </div>
            <CardContent className="p-6 space-y-4 text-center">
              <p className="text-muted-foreground">
                Para finalizar a sua compra, é necessário criar uma conta ou fazer login.
              </p>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Clientes internacionais são aprovados automaticamente!
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <Link href="/login?tab=register&redirect=/checkout" className="w-full">
                  <Button className="w-full h-12 rounded-xl shadow-md" data-testid="button-register-checkout">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Criar Conta
                  </Button>
                </Link>
                <Link href="/login?redirect=/checkout" className="w-full">
                  <Button variant="outline" className="w-full h-12 rounded-xl" data-testid="button-login-checkout">
                    Já tenho conta - Entrar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ShippingOptionsSection = () => (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="h-5 w-5 text-primary" />
          Opção de Envio
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <RadioGroup
          value={selectedShippingId}
          onValueChange={setSelectedShippingId}
          className="space-y-3"
          data-testid="shipping-options-group"
        >
          {shippingOptions.map((option) => (
            <div
              key={option.id}
              className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedShippingId === option.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}
              onClick={() => setSelectedShippingId(option.id)}
            >
              <RadioGroupItem
                value={option.id}
                id={`shipping-${option.id}`}
                className="data-[state=checked]:border-primary"
                data-testid={`radio-shipping-${option.id}`}
              />
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`shipping-${option.id}`}
                  className="font-semibold cursor-pointer"
                >
                  {option.name}
                </Label>
                {option.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                )}
                {option.estimatedDays && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    Entrega: {option.estimatedDays} dias úteis
                  </p>
                )}
              </div>
              <div className="text-right">
                {Number(option.price) === 0 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-sm">
                    Grátis
                  </Badge>
                ) : (
                  <span className="font-bold text-lg">
                    {Number(option.price).toLocaleString("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </RadioGroup>
        {!selectedShippingId && shippingOptions.length > 0 && (
          <p className="text-sm text-destructive mt-3 flex items-center gap-1">
            Por favor selecione uma opção de envio
          </p>
        )}
      </CardContent>
    </Card>
  );

  const ProductsSection = () => (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-primary" />
          Produtos ({cartItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {cartItems.map((item) => {
          const applicableRule = getApplicablePromotionRule(item.quantity, item.product.promotionRules);
          const originalTotal = Number(item.product.price) * item.quantity;
          const discountedTotal = calculateItemPrice(item.quantity, item.product.price, item.product.promotionRules);
          const hasDiscount = applicableRule !== null;

          return (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.product.image ? (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground/30">CARA</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium line-clamp-1">{item.product.name}</p>
                  {hasDiscount && (
                    <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                      <Tag className="h-3 w-3 mr-1" />
                      Promo
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {hasDiscount ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs text-muted-foreground line-through">
                      {originalTotal.toLocaleString("pt-PT", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {discountedTotal.toLocaleString("pt-PT", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                ) : (
                  <p className="font-bold">
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

  const PaymentMethodCard = ({ choice, isSelected }: { choice: { value: PaymentChoice; label: string }; isSelected: boolean }) => {
    const methodInfo: Record<string, { icon: React.ReactNode; description: string }> = {
      paypal: {
        icon: <div className="text-2xl">💳</div>,
        description: "Pague com PayPal ou cartão"
      },
      stripe: {
        icon: <CreditCard className="h-6 w-6 text-primary" />,
        description: "Pague com cartão de crédito"
      },
      eupago_multibanco: {
        icon: <div className="text-2xl">🏦</div>,
        description: "Referência Multibanco"
      },
      eupago_mbway: {
        icon: <div className="text-2xl">📱</div>,
        description: "Pagamento instantâneo MB WAY"
      },
    };

    const info = methodInfo[choice.value] || { icon: <div className="text-2xl">💰</div>, description: "" };

    return (
      <div
        onClick={() => setPaymentChoice(choice.value)}
        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
          isSelected
            ? "border-primary bg-primary/5 shadow-md"
            : "border-border bg-background hover:border-primary/40 hover:shadow-md"
        }`}
        data-testid={`payment-card-${choice.value}`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
            {info.icon}
          </div>
          <div className="flex-1">
            <div className="font-semibold">{choice.label}</div>
            {info.description && (
              <div className="text-sm text-muted-foreground mt-0.5">{info.description}</div>
            )}
          </div>
          {isSelected && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const OrderSummaryCard = () => (
    <Card className="border-0 shadow-lg overflow-hidden lg:sticky lg:top-24">
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
            {subtotal.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
            })}
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

        <Separator />

        {/* Shipping */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Envio</span>
          <span className="font-medium" data-testid="text-shipping-cost">
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
        {selectedShipping && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {selectedShipping.name}
            {selectedShipping.estimatedDays && ` - ${selectedShipping.estimatedDays} dias úteis`}
          </p>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary" data-testid="text-order-total">
            {total.toLocaleString("pt-PT", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
        </div>

        {/* Payment Methods - Desktop */}
        <div className="hidden lg:block space-y-4 pt-2">
          <Separator />
          <div className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Método de Pagamento
          </div>
          <div className="space-y-3">
            {availablePaymentChoices.map((choice) => (
              <PaymentMethodCard
                key={choice.value}
                choice={choice}
                isSelected={paymentChoice === choice.value}
              />
            ))}
          </div>

          {/* Payment Buttons */}
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
                  title: "Pedido criado com sucesso!",
                  description: "Abra o app MB WAY AGORA e confirme o pagamento. Tem apenas 5 minutos!",
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
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/carrinho" className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors">
            <ShoppingCart className="h-4 w-4" />
            <span>Carrinho</span>
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md">
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
            <h1 className="text-3xl font-bold">Finalizar Compra</h1>
            <p className="text-muted-foreground mt-1">
              Complete os dados abaixo para finalizar o seu pedido
            </p>
          </div>
          <Link href="/carrinho">
            <Button variant="outline" className="gap-2" data-testid="button-back-cart">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Carrinho
            </Button>
          </Link>
        </div>

        {/* Savings Banner */}
        {totalSavings > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-500/20">
                <Tag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                Está a poupar <span className="font-bold">{totalSavings.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}</span> com as nossas ofertas!
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {/* Shipping Data Card */}
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      Dados de Envio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5">
                    {/* User Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Nome
                        </label>
                        <Input
                          value={`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "-"}
                          disabled
                          className="bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email
                        </label>
                        <Input value={user?.email || "-"} disabled className="bg-muted/50" />
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            Endereço de Envio
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Rua, número, código postal, cidade..."
                              className="min-h-[100px] resize-none"
                              {...field}
                              data-testid="input-shipping-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Notas (opcional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Instruções especiais de entrega..."
                              className="min-h-[80px] resize-none"
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

                {/* Payment Methods - Mobile */}
                <div className="lg:hidden space-y-4">
                  <Card className="border-0 shadow-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Método de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {availablePaymentChoices.map((choice) => (
                        <PaymentMethodCard
                          key={choice.value}
                          choice={choice}
                          isSelected={paymentChoice === choice.value}
                        />
                      ))}

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
                              title: "Pedido criado com sucesso!",
                              description: "Abra o app MB WAY AGORA e confirme o pagamento. Tem apenas 5 minutos!",
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
                    </CardContent>
                  </Card>
                </div>
              </form>
            </Form>
          </div>

          <div>
            <OrderSummaryCard />

          </div>
        </div>
      </div>
    </div>
  );
}