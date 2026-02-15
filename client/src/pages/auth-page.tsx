import { RegisterForm } from "@/components/register-form";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { z } from "zod";
import { useLocationContext } from "@/contexts/LocationContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { saveAuthUser } from "@/lib/authPersistence";

const professionKeys = [
  "doctor",
  "derm",
  "aesthetic",
  "plastic",
  "nurse",
  "pharma",
  "clinic",
  "distributor",
  "other",
];

export default function AuthPage() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const tabParam = urlParams.get("tab");

  const [isLogin, setIsLogin] = useState(tabParam !== "register");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { location: userLocation, isInternational } = useLocationContext();
  const { t } = useLanguage();

  useEffect(() => {
    if (tabParam === "register") {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [tabParam]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const registerSchema = useMemo(() => z.object({
    email: z.string().email(t("auth.validation.invalidEmail")),
    password: z.string().min(6, t("auth.validation.passwordMin")),
    confirmPassword: z.string(),
    firstName: z.string().min(1, t("auth.validation.requiredField")),
    lastName: z.string().min(1, t("auth.validation.requiredField")),
    phone: z.string().min(9, t("auth.validation.invalidPhone")),
    profession: z.string().min(1, t("auth.validation.requiredField")),
    additionalInfo: z.string().optional(),
    acceptTerms: z.boolean(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("auth.validation.passwordMatch"),
    path: ["confirmPassword"],
  }).refine((data) => data.acceptTerms === true, {
    message: t("auth.validation.acceptTerms"),
    path: ["acceptTerms"],
  }), [t]);

  const loginSchema = useMemo(() => z.object({
    email: z.string().email(t("auth.validation.invalidEmail")),
    password: z.string().min(1, t("auth.validation.requiredField")),
    rememberMe: z.boolean().optional(),
  }), [t]);

  type RegisterInput = z.infer<typeof registerSchema>;
  type LoginInput = z.infer<typeof loginSchema>;

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
    onSuccess: (data: { success: boolean; user: any }) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      saveAuthUser(data.user);
      if (isInternational) {
        toast({
          title: t("auth.register.successTitle"),
          description: t("auth.register.successDescApp"),
        });
      } else {
        toast({
          title: t("auth.register.successTitle"),
          description: t("auth.register.successDescPend"),
        });
      }
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.register.errorTitle"),
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
    onSuccess: (data: { success: boolean; user: any }) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      saveAuthUser(data.user);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.login.errorTitle"),
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
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}

          {isLogin && (
            <Card className="flex-1 max-w-md">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">{t("auth.login.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.login.emailLabel")} <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t("auth.login.emailPlaceholder")} {...field} data-testid="input-email-login" />
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
                          <FormLabel>{t("auth.login.passwordLabel")} <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="password" placeholder={t("auth.login.passwordPlaceholder")} {...field} data-testid="input-password-login" />
                          </FormControl>
                          <div className="text-right">
                            <a href="/recuperar-senha" className="text-sm text-primary underline">
                              {t("auth.login.forgotPassword")}
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
                            {t("auth.login.rememberMe")}
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
                      {loginMutation.isPending ? t("auth.login.submittingButton") : t("auth.login.submitButton")}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      {t("auth.login.registerLinkText")}{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-primary underline"
                        data-testid="link-to-register"
                      >
                        {t("auth.login.registerLink")}
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
