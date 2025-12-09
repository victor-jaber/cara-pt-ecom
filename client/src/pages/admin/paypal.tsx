import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, Eye, EyeOff, Loader2, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const paypalSettingsSchema = z.object({
  clientId: z.string().min(1, "ID do Cliente é obrigatório"),
  clientSecret: z.string().min(1, "Segredo do Cliente é obrigatório"),
  mode: z.enum(["sandbox", "live"]),
  enabled: z.boolean(),
});

type PaypalSettingsForm = z.infer<typeof paypalSettingsSchema>;

interface PaypalSettings {
  clientId: string;
  clientSecret: string;
  mode: "sandbox" | "live";
  isEnabled: boolean;
  hasSecret: boolean;
}

export default function AdminPaypal() {
  const { toast } = useToast();
  const [showSecret, setShowSecret] = useState(false);

  const { data: settings, isLoading } = useQuery<PaypalSettings>({
    queryKey: ["/api/admin/paypal-settings"],
  });

  const form = useForm<PaypalSettingsForm>({
    resolver: zodResolver(paypalSettingsSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
      mode: "sandbox",
      enabled: false,
    },
    values: settings ? {
      clientId: settings.clientId || "",
      clientSecret: settings.hasSecret ? "********" : "",
      mode: settings.mode || "sandbox",
      enabled: settings.isEnabled || false,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PaypalSettingsForm) => {
      const res = await apiRequest("POST", "/api/admin/paypal-settings", {
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        mode: data.mode,
        isEnabled: data.enabled,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/paypal-settings"] });
      toast({
        title: "Configurações Guardadas",
        description: "As configurações do PayPal foram atualizadas com sucesso.",
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

  const onSubmit = (data: PaypalSettingsForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isLiveMode = form.watch("mode") === "live";
  const isEnabled = form.watch("enabled");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-paypal-title">
          Configurações PayPal
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure a integração de pagamentos PayPal para a loja
        </p>
      </div>

      {isLiveMode && isEnabled && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Modo de Produção Ativo</AlertTitle>
          <AlertDescription>
            O PayPal está configurado em modo LIVE. Os pagamentos serão processados com dinheiro real.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credenciais API
          </CardTitle>
          <CardDescription>
            Introduza as credenciais da sua conta PayPal Business. Pode encontrá-las no painel de desenvolvedor do PayPal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Ativar PayPal</FormLabel>
                      <FormDescription>
                        Permitir pagamentos via PayPal no checkout
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-paypal-enabled"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-paypal-mode">
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
                        <SelectItem value="live">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-green-500" />
                            Live (Produção)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Use Sandbox para testes e Live para pagamentos reais
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do Cliente (Client ID)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="AX..."
                        data-testid="input-paypal-client-id"
                      />
                    </FormControl>
                    <FormDescription>
                      O Client ID da sua aplicação PayPal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segredo do Cliente (Client Secret)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showSecret ? "text" : "password"}
                          placeholder="EK..."
                          className="pr-10"
                          data-testid="input-paypal-client-secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowSecret(!showSecret)}
                          data-testid="button-toggle-secret"
                        >
                          {showSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      O Client Secret da sua aplicação PayPal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-paypal"
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar Configurações
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações de Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Como obter as credenciais:</p>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Aceda a developer.paypal.com</li>
              <li>Faça login com a sua conta PayPal Business</li>
              <li>Vá a My Apps & Credentials</li>
              <li>Crie uma nova app ou selecione uma existente</li>
              <li>Copie o Client ID e Client Secret</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-foreground">Modo Sandbox:</p>
            <p>Use para testar pagamentos sem dinheiro real. Pode criar contas de teste no painel do PayPal.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Modo Live:</p>
            <p>Use apenas quando estiver pronto para aceitar pagamentos reais. Certifique-se de que as credenciais são da conta Live.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
