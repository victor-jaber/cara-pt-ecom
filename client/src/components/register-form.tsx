import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { MultiStepRegister } from "@/components/multi-step-register";

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

interface RegisterFormProps {
    onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
    const { t } = useLanguage();
    const [showVerification, setShowVerification] = useState(false);
    const [formData, setFormData] = useState<any>(null);

    const registerSchema = z.object({
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
    });

    type RegisterInput = z.infer<typeof registerSchema>;

    const form = useForm<RegisterInput>({
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

    const onSubmit = (data: RegisterInput) => {
        setFormData(data);
        setShowVerification(true);
    };

    if (showVerification && formData) {
        return <MultiStepRegister formData={formData} onBack={() => setShowVerification(false)} />;
    }

    return (
        <Card className="flex-1 max-w-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-primary">{t("auth.register.title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.register.firstNameLabel")} <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} data-testid="input-firstname" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.register.lastNameLabel")} <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} data-testid="input-lastname" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.register.emailLabel")} <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder={t("auth.register.emailPlaceholder")} {...field} data-testid="input-email-register" />
                                    </FormControl>
                                    <FormDescription>{t("auth.register.emailLabel")}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.register.passwordLabel")} <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder={t("auth.register.passwordPlaceholder")} {...field} data-testid="input-password-register" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.register.confirmPasswordLabel")} <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder={t("auth.register.confirmPasswordPlaceholder")} {...field} data-testid="input-confirm-password" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.register.phoneLabel")} <span className="text-destructive">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("auth.register.phonePlaceholder")} {...field} data-testid="input-phone" />
                                    </FormControl>
                                    <FormDescription>{t("auth.register.phoneDescription")}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="profession"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.register.professionLabel")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger data-testid="select-profession">
                                                <SelectValue placeholder={t("auth.register.professionPlaceholder")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {professionKeys.map((key) => (
                                                <SelectItem key={key} value={key}>
                                                    {t(`auth.professions.${key}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>{t("auth.register.professionDescription")}</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="additionalInfo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.register.additionalInfoLabel")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("auth.register.additionalInfoPlaceholder")}
                                            {...field}
                                            data-testid="input-additional-info"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
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
                                            {t("auth.register.termsLabel")}{" "}
                                            <a href="/politica-privacidade" className="text-primary underline">
                                                {t("auth.register.privacyLink")}
                                            </a>{" "}
                                            {t("auth.register.and")}{" "}
                                            <a href="/termos" className="text-primary underline">
                                                {t("auth.register.termsLink")}
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
                            data-testid="button-register-submit"
                        >
                            {t("auth.register.submitButton")}
                        </Button>

                        <p className="text-center text-sm text-muted-foreground">
                            {t("auth.register.loginLinkText")}{" "}
                            <button
                                type="button"
                                onClick={onSwitchToLogin}
                                className="text-primary underline"
                                data-testid="link-to-login"
                            >
                                {t("auth.register.loginLink")}
                            </button>
                        </p>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
