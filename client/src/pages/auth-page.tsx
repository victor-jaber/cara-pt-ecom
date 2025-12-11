import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { z } from "zod";
import { useLocationContext } from "@/contexts/LocationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  phone: z.string().min(9, "Número de telemóvel inválido"),
  profession: z.string().min(1, "Selecione a sua profissão"),
  additionalInfo: z.string().optional(),
  acceptTerms: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As palavras-passe não coincidem",
  path: ["confirmPassword"],
}).refine((data) => data.acceptTerms === true, {
  message: "Deve aceitar as políticas de privacidade",
  path: ["acceptTerms"],
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Palavra-passe é obrigatória"),
  rememberMe: z.boolean().optional(),
});

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

const professions = [
  "Médico(a)",
  "Médico(a) Dermatologista",
  "Médico(a) Estético",
  "Médico(a) Cirurgião Plástico",
  "Enfermeiro(a)",
  "Farmacêutico(a)",
  "Clínica Estética",
  "Distribuidor",
  "Outro",
];

export default function AuthPage() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const tabParam = urlParams.get("tab");
  
  const [isLogin, setIsLogin] = useState(tabParam !== "register");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { location: userLocation, isInternational } = useLocationContext();
  
  useEffect(() => {
    if (tabParam === "register") {
      setIsLogin(false);
    }
  }, [tabParam]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      profession: "",
      additionalInfo: "",
      acceptTerms: false,
    },
  });

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      const dataWithLocation = {
        ...data,
        location: userLocation || "portugal",
      };
      const res = await apiRequest("POST", "/api/auth/register", dataWithLocation);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      if (isInternational) {
        toast({
          title: "Registo efetuado com sucesso",
          description: "A sua conta foi ativada. Pode começar a comprar.",
        });
      } else {
        toast({
          title: "Registo efetuado com sucesso",
          description: "A sua conta está pendente de aprovação.",
        });
      }
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no registo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onRegister = (data: RegisterInput) => {
    registerMutation.mutate(data);
  };

  const onLogin = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8 justify-center">
          {!isLogin && (
            <Card className="flex-1 max-w-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Regista-te</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-firstname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="E-mail" {...field} data-testid="input-email-register" />
                          </FormControl>
                          <FormDescription>E-mail</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Palavra-passe <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Escolha a sua palavra-passe" {...field} data-testid="input-password-register" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirme a palavra-passe <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirme a sua nova palavra-passe." {...field} data-testid="input-confirm-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telemóvel <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="E.x. +351 300 400 500" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormDescription>Insira aqui o seu número de telemóvel</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selecionar</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-profession">
                                <SelectValue placeholder="Profissão" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {professions.map((profession) => (
                                <SelectItem key={profession} value={profession}>
                                  {profession}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Selecione a sua profissão</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Informações adicionais</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Escreva aqui as suas informações adicionais." 
                              {...field} 
                              data-testid="input-additional-info"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-terms"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal">
                              Políticas de privacidade e cookies<br />
                              Li e aceito as{" "}
                              <a href="/politica-privacidade" className="text-primary underline">
                                políticas de privacidade
                              </a>{" "}
                              e{" "}
                              <a href="/termos" className="text-primary underline">
                                termos e condições
                              </a>
                              .
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "A registar..." : "Regista-te"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Já tem uma conta?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="text-primary underline"
                        data-testid="link-to-login"
                      >
                        Faça login
                      </button>
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {isLogin && (
            <Card className="flex-1 max-w-md">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Faça Login</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="insira o seu e-mail" {...field} data-testid="input-email-login" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Palavra-Passe <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Insira a sua palavra-passe" {...field} data-testid="input-password-login" />
                          </FormControl>
                          <div className="text-right">
                            <a href="/recuperar-senha" className="text-sm text-primary underline">
                              Perdeu a sua palavra passe?
                            </a>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-remember"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Lembre-se de mim
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "A entrar..." : "Login"}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Não tem uma conta?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-primary underline"
                        data-testid="link-to-register"
                      >
                        Registe-se
                      </button>
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
