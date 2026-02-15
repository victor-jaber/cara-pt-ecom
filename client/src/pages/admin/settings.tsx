import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";

type NotificationSettingsResponse = {
  notificationEmail: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

const formSchema = z.object({
  notificationEmail: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, { message: "Email inválido" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminSettings() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<NotificationSettingsResponse>({
    queryKey: ["/api/admin/notification-settings"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notificationEmail: "",
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      notificationEmail: data.notificationEmail || "",
    });
  }, [data, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("PUT", "/api/admin/notification-settings", {
        notificationEmail: values.notificationEmail?.trim() ? values.notificationEmail.trim() : null,
      });
      return (await res.json()) as NotificationSettingsResponse;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-settings"] });
      toast({
        title: "Guardado",
        description: "As configurações foram atualizadas.",
      });
    },
    onError: async (err: any) => {
      let message = "Não foi possível atualizar as configurações.";
      try {
        const parsed = typeof err?.message === "string" ? JSON.parse(err.message) : null;
        if (parsed?.message) message = parsed.message;
      } catch {
        // ignore
      }
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  const currentEmail = form.watch("notificationEmail")?.trim();
  const isConfigured = !!currentEmail;

  return (
    <div className="space-y-6" data-testid="admin-settings">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Defina para onde vão os avisos internos do Admin.</p>
      </div>

      {!isConfigured && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            O email de notificações não está configurado. Não serão enviados avisos de novos cadastros pendentes nem
            mensagens do formulário de contacto.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email de Notificações</CardTitle>
          <CardDescription>
            Email único para receber avisos de “cadastro pendente” e “mensagens do contacto”.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">A carregar...</div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="notificationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="ex: operacoes@cara-portugal.pt"
                          data-testid="input-notification-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-save-notification-email"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        A guardar...
                      </>
                    ) : (
                      "Guardar"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={updateMutation.isPending}
                    onClick={() => form.reset({ notificationEmail: data?.notificationEmail || "" })}
                    data-testid="button-reset-notification-email"
                  >
                    Repor
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
