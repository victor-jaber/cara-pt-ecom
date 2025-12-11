import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Mail, CheckCircle2, Loader2, MessageCircle } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Por favor insira um email válido"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const WHATSAPP_NUMBER = "351910060560";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return res.json();
    },
    onSuccess: () => {
      setEmailSent(true);
      setSubmittedEmail(form.getValues("email"));
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o email de recuperação.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    resetMutation.mutate(data);
  };

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent(
      `Olá, preciso de ajuda para recuperar a senha da minha conta CARA. Email: ${form.getValues("email") || "(não preenchido)"}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-muted/30 py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-2xl">Email Enviado</CardTitle>
            <CardDescription>
              Se existir uma conta com o email <strong>{submittedEmail}</strong>, receberá instruções para redefinir a sua palavra-passe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Verifique também a pasta de spam ou lixo eletrónico.
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button variant="outline" className="w-full" data-testid="button-back-login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Login
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setEmailSent(false);
                  form.reset();
                }}
                data-testid="button-try-another-email"
              >
                Tentar com outro email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Recuperar Palavra-passe</CardTitle>
          <CardDescription>
            Insira o seu email e enviaremos instruções para redefinir a sua palavra-passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="O seu email de registo"
                        {...field}
                        data-testid="input-email-reset"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={resetMutation.isPending}
                data-testid="button-submit-reset"
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A enviar...
                  </>
                ) : (
                  "Enviar Instruções"
                )}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleWhatsAppSupport}
              data-testid="button-whatsapp-support"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Contactar Suporte via WhatsApp
            </Button>

            <Link href="/login">
              <Button variant="ghost" className="w-full text-muted-foreground" data-testid="button-back-login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
