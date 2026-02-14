import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CreditCard, Eye, EyeOff, Loader2, Shield } from "lucide-react";

type AdminPaymentMethodsResponse = {
  paypal: {
    clientId: string;
    clientSecret: string;
    mode: "sandbox" | "live";
    isEnabled: boolean;
    hasSecret: boolean;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    mode: "test" | "live";
    isEnabled: boolean;
    hasSecret: boolean;
  };
  eupago: {
    apiKey: string;
    mode: "sandbox" | "live";
    isEnabled: boolean;
    hasSecret: boolean;
  };
};

const masked = "********";

const paymentMethodsSchema = z
  .object({
    paypal: z.object({
      enabled: z.boolean(),
      mode: z.enum(["sandbox", "live"]),
      clientId: z.string().optional().default(""),
      clientSecret: z.string().optional().default(""),
    }),
    stripe: z.object({
      enabled: z.boolean(),
      mode: z.enum(["test", "live"]),
      publishableKey: z.string().optional().default(""),
      secretKey: z.string().optional().default(""),
    }),
    eupago: z.object({
      enabled: z.boolean(),
      mode: z.enum(["sandbox", "live"]),
      apiKey: z.string().optional().default(""),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.paypal.enabled) {
      if (!value.paypal.clientId?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paypal", "clientId"], message: "Client ID obrigatório" });
      }
      if (!value.paypal.clientSecret?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paypal", "clientSecret"], message: "Client Secret obrigatório" });
      }
    }

    if (value.stripe.enabled) {
      if (!value.stripe.publishableKey?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stripe", "publishableKey"], message: "Publishable Key obrigatório" });
      }
      if (!value.stripe.secretKey?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stripe", "secretKey"], message: "Secret Key obrigatório" });
      }
    }

    if (value.eupago.enabled) {
      if (!value.eupago.apiKey?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["eupago", "apiKey"], message: "API Key obrigatório" });
      }
    }

    // Allow masked secrets to pass validation.
    if (value.paypal.clientSecret === masked) {
      // ok
    }
    if (value.stripe.secretKey === masked) {
      // ok
    }
    if (value.eupago.apiKey === masked) {
      // ok
    }
  });

type PaymentMethodsForm = z.infer<typeof paymentMethodsSchema>;

export default function AdminPaypal() {
  const { toast } = useToast();

  const [showPaypalSecret, setShowPaypalSecret] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showEupagoKey, setShowEupagoKey] = useState(false);

  const { data: settings, isLoading } = useQuery<AdminPaymentMethodsResponse>({
    queryKey: ["/api/admin/payment-methods"],
    // Do not auto-refetch in the background, otherwise secrets get reset to masked values
    // and the eye toggle never reveals what the admin just typed.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const form = useForm<PaymentMethodsForm>({
    resolver: zodResolver(paymentMethodsSchema),
    defaultValues: {
      paypal: { enabled: false, mode: "sandbox", clientId: "", clientSecret: "" },
      stripe: { enabled: false, mode: "test", publishableKey: "", secretKey: "" },
      eupago: { enabled: false, mode: "sandbox", apiKey: "" },
    },
  });

  const didInitFromServer = useRef(false);

  const revealedRef = useRef<AdminPaymentMethodsResponse | null>(null);
  const revealInFlightRef = useRef<Promise<AdminPaymentMethodsResponse> | null>(null);

  const ensureRevealed = async (): Promise<AdminPaymentMethodsResponse> => {
    if (revealedRef.current) return revealedRef.current;
    if (revealInFlightRef.current) return revealInFlightRef.current;

    const p = (async () => {
      // Add a nonce to avoid any intermediary caching of a sensitive response.
      const res = await apiRequest("GET", `/api/admin/payment-methods?reveal=1&_=${Date.now()}`);
      const data = (await res.json()) as AdminPaymentMethodsResponse;
      revealedRef.current = data;
      return data;
    })();

    revealInFlightRef.current = p;
    try {
      return await p;
    } finally {
      revealInFlightRef.current = null;
    }
  };

  useEffect(() => {
    if (!settings) return;

    // Only initialize once (or when the form isn't dirty), so background refetches
    // don't overwrite typed secrets with masked placeholders.
    if (didInitFromServer.current && form.formState.isDirty) return;

    form.reset({
      paypal: {
        enabled: settings.paypal.isEnabled,
        mode: settings.paypal.mode,
        clientId: settings.paypal.clientId || "",
        clientSecret: settings.paypal.hasSecret ? masked : "",
      },
      stripe: {
        enabled: settings.stripe.isEnabled,
        mode: settings.stripe.mode,
        publishableKey: settings.stripe.publishableKey || "",
        secretKey: settings.stripe.hasSecret ? masked : "",
      },
      eupago: {
        enabled: settings.eupago.isEnabled,
        mode: settings.eupago.mode,
        apiKey: settings.eupago.hasSecret ? masked : "",
      },
    });
    didInitFromServer.current = true;
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: PaymentMethodsForm) => {
      const res = await apiRequest("POST", "/api/admin/payment-methods", {
        paypal: {
          clientId: data.paypal.clientId,
          clientSecret: data.paypal.clientSecret,
          mode: data.paypal.mode,
          isEnabled: data.paypal.enabled,
        },
        stripe: {
          publishableKey: data.stripe.publishableKey,
          secretKey: data.stripe.secretKey,
          mode: data.stripe.mode,
          isEnabled: data.stripe.enabled,
        },
        eupago: {
          apiKey: data.eupago.apiKey,
          mode: data.eupago.mode,
          isEnabled: data.eupago.enabled,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods/setup"] });
      queryClient.invalidateQueries({ queryKey: ["/api/paypal/setup"] });
      toast({
        title: "Configurações Guardadas",
        description: "Os métodos de pagamento foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Guardar",
        description: error.message || "Não foi possível guardar as configurações.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const paypalLive = form.watch("paypal.mode") === "live" && form.watch("paypal.enabled");
  const stripeLive = form.watch("stripe.mode") === "live" && form.watch("stripe.enabled");
  const eupagoLive = form.watch("eupago.mode") === "live" && form.watch("eupago.enabled");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Métodos de Pagamento</h1>
        <p className="text-muted-foreground mt-1">
          Configure PayPal, Stripe e EuPago. Todos podem ficar ativos ao mesmo tempo.
        </p>
      </div>

      {(paypalLive || stripeLive || eupagoLive) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Modo de Produção Ativo</AlertTitle>
          <AlertDescription>
            Pelo menos um gateway está em modo LIVE. Pagamentos reais podem ser processados.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
          <Tabs defaultValue="paypal" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="eupago">EuPago</TabsTrigger>
            </TabsList>

            <TabsContent value="paypal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    PayPal
                  </CardTitle>
                  <CardDescription>Pagamentos via PayPal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="paypal.enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativar PayPal</FormLabel>
                          <FormDescription>Permitir pagamentos via PayPal no checkout</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paypal.mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o modo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sandbox">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                Sandbox (Teste)
                              </div>
                            </SelectItem>
                            <SelectItem value="live">Live (Produção)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paypal.clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="AX..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paypal.clientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              type={showPaypalSecret ? "text" : "password"}
                              placeholder="********"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                if (showPaypalSecret) {
                                  setShowPaypalSecret(false);
                                  return;
                                }
                                if (field.value === masked) {
                                  const revealed = await ensureRevealed();
                                  form.setValue(
                                    "paypal.clientSecret",
                                    revealed.paypal.clientSecret || "",
                                    { shouldDirty: false },
                                  );
                                }
                                setShowPaypalSecret(true);
                              } catch (e: any) {
                                toast({
                                  title: "Não foi possível revelar",
                                  description: e?.message || "Falha ao buscar o segredo.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-label={showPaypalSecret ? "Ocultar" : "Mostrar"}
                          >
                            {showPaypalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stripe">
              <Card>
                <CardHeader>
                  <CardTitle>Stripe</CardTitle>
                  <CardDescription>Pagamentos via Stripe (cartão) com Stripe Elements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="stripe.enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativar Stripe</FormLabel>
                          <FormDescription>Permitir pagamentos via Stripe no checkout</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stripe.mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o modo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="test">Teste</SelectItem>
                            <SelectItem value="live">Live (Produção)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stripe.publishableKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publishable Key</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="pk_..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stripe.secretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secret Key</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              type={showStripeSecret ? "text" : "password"}
                              placeholder="sk_..."
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                if (showStripeSecret) {
                                  setShowStripeSecret(false);
                                  return;
                                }
                                if (field.value === masked) {
                                  const revealed = await ensureRevealed();
                                  form.setValue(
                                    "stripe.secretKey",
                                    revealed.stripe.secretKey || "",
                                    { shouldDirty: false },
                                  );
                                }
                                setShowStripeSecret(true);
                              } catch (e: any) {
                                toast({
                                  title: "Não foi possível revelar",
                                  description: e?.message || "Falha ao buscar o segredo.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-label={showStripeSecret ? "Ocultar" : "Mostrar"}
                          >
                            {showStripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="eupago">
              <Card>
                <CardHeader>
                  <CardTitle>EuPago (Portugal)</CardTitle>
                  <CardDescription>
                    EuPago aparece no checkout para clientes em Portugal e Brasil (Multibanco e MBWay).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="eupago.enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Ativar EuPago</FormLabel>
                          <FormDescription>Permitir pagamentos via EuPago em Portugal</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eupago.mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o modo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox (Teste)</SelectItem>
                            <SelectItem value="live">Live (Produção)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eupago.apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              type={showEupagoKey ? "text" : "password"}
                              placeholder="********"
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                if (showEupagoKey) {
                                  setShowEupagoKey(false);
                                  return;
                                }
                                if (field.value === masked) {
                                  const revealed = await ensureRevealed();
                                  form.setValue(
                                    "eupago.apiKey",
                                    revealed.eupago.apiKey || "",
                                    { shouldDirty: false },
                                  );
                                }
                                setShowEupagoKey(true);
                              } catch (e: any) {
                                toast({
                                  title: "Não foi possível revelar",
                                  description: e?.message || "Falha ao buscar o segredo.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            aria-label={showEupagoKey ? "Ocultar" : "Mostrar"}
                          >
                            {showEupagoKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
