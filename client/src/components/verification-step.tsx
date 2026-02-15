import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeInput } from "@/components/code-input";
import { Loader2, ArrowLeft } from "lucide-react";

interface VerificationStepProps {
    email: string;
    type: "registration" | "email_change";
    onVerified: (verificationId: string) => void;
    onBack: () => void;
}

export function VerificationStep({ email, type, onVerified, onBack }: VerificationStepProps) {
    const { toast } = useToast();
    const [code, setCode] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    // Send verification code
    const sendCodeMutation = useMutation({
        mutationFn: async () => {
            return apiRequest("POST", "/api/auth/send-verification-code", { email, type });
        },
        onSuccess: () => {
            toast({
                title: "Código Enviado",
                description: `Enviámos um código de verificação para ${email}`,
            });
            setResendCooldown(60); // 60 second cooldown
            const interval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        },
        onError: (error: any) => {
            toast({
                title: "Erro",
                description: error.message || "Não foi possível enviar o código",
                variant: "destructive",
            });
        },
    });

    // Verify code
    const verifyCodeMutation = useMutation({
        mutationFn: async (code: string) => {
            return apiRequest("POST", "/api/auth/verify-email-code", { email, code, type });
        },
        onSuccess: (data: any) => {
            toast({
                title: "Email Verificado",
                description: "O seu email foi verificado com sucesso",
            });
            onVerified(data.verificationId);
        },
        onError: (error: any) => {
            toast({
                title: "Código Inválido",
                description: error.message || "Código inválido ou expirado",
                variant: "destructive",
            });
            setCode("");
        },
    });

    // Auto-send code on mount
    useState(() => {
        sendCodeMutation.mutate();
    });

    const handleCodeComplete = (completedCode: string) => {
        verifyCodeMutation.mutate(completedCode);
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">Verificação de Email</CardTitle>
                <CardDescription>
                    Enviámos um código de 6 dígitos para <strong>{email}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground text-center">
                        Introduza o código que recebeu por email:
                    </div>

                    <CodeInput
                        value={code}
                        onChange={setCode}
                        onComplete={handleCodeComplete}
                        error={verifyCodeMutation.isError}
                    />

                    {verifyCodeMutation.isError && (
                        <p className="text-sm text-red-500 text-center">
                            Código inválido ou expirado
                        </p>
                    )}

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={onBack}
                            disabled={verifyCodeMutation.isPending}
                            className="flex-1"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => sendCodeMutation.mutate()}
                            disabled={resendCooldown > 0 || sendCodeMutation.isPending}
                            className="flex-1"
                        >
                            {sendCodeMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    A enviar...
                                </>
                            ) : resendCooldown > 0 ? (
                                `Reenviar em ${resendCooldown}s`
                            ) : (
                                "Reenviar Código"
                            )}
                        </Button>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            ⏰ <strong>Este código expira em 15 minutos.</strong>
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Se não recebeu o email, verifique a pasta de spam.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
