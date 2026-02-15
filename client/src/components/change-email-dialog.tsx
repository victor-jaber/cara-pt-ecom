import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeInput } from "@/components/code-input";
import { Loader2 } from "lucide-react";

interface ChangeEmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentEmail: string;
}

type EmailChangeStep = "input" | "verify";

export function ChangeEmailDialog({ open, onOpenChange, currentEmail }: ChangeEmailDialogProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<EmailChangeStep>("input");
    const [newEmail, setNewEmail] = useState("");
    const [code, setCode] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    // Send verification code
    const sendCodeMutation = useMutation({
        mutationFn: async () => {
            return apiRequest("POST", "/api/auth/send-verification-code", {
                email: newEmail,
                type: "email_change"
            });
        },
        onSuccess: () => {
            toast({
                title: "Código Enviado",
                description: `Enviámos um código de verificação para ${newEmail}`,
            });
            setStep("verify");
            setResendCooldown(60);
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

    // Verify code and change email
    const changeEmailMutation = useMutation({
        mutationFn: async (verificationCode: string) => {
            // First verify the code
            const verifyRes = await apiRequest("POST", "/api/auth/verify-email-code", {
                email: newEmail,
                code: verificationCode,
                type: "email_change",
            });

            // Then update the email with verificationId
            const updateRes = await apiRequest("PUT", "/api/user/profile", {
                email: newEmail,
                verificationId: verifyRes.verificationId,
            });

            return updateRes;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast({
                title: "Email Atualizado",
                description: "O seu email foi alterado com sucesso",
            });
            onOpenChange(false);
            resetDialog();
        },
        onError: (error: any) => {
            toast({
                title: "Erro",
                description: error.message || "Código inválido ou expirado",
                variant: "destructive",
            });
            setCode("");
        },
    });

    const handleSendCode = () => {
        if (!newEmail || newEmail === currentEmail) {
            toast({
                title: "Email Inválido",
                description: "Por favor, insira um email diferente do actual",
                variant: "destructive",
            });
            return;
        }
        sendCodeMutation.mutate();
    };

    const handleCodeComplete = (completedCode: string) => {
        changeEmailMutation.mutate(completedCode);
    };

    const resetDialog = () => {
        setStep("input");
        setNewEmail("");
        setCode("");
        setResendCooldown(0);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetDialog();
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                {step === "input" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Alterar Email</DialogTitle>
                            <DialogDescription>
                                Email actual: <strong>{currentEmail}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-email">Novo Email</Label>
                                <Input
                                    id="new-email"
                                    type="email"
                                    placeholder="novo@email.com"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    ℹ️ Iremos enviar um código de verificação para o novo email.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleSendCode}
                                disabled={sendCodeMutation.isPending || !newEmail}
                            >
                                {sendCodeMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        A enviar...
                                    </>
                                ) : (
                                    "Enviar Código"
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === "verify" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Verificar Código</DialogTitle>
                            <DialogDescription>
                                Enviámos um código para <strong>{newEmail}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="text-sm text-muted-foreground text-center">
                                Introduza o código de 6 dígitos:
                            </div>

                            <CodeInput
                                value={code}
                                onChange={setCode}
                                onComplete={handleCodeComplete}
                                error={changeEmailMutation.isError}
                            />

                            {changeEmailMutation.isError && (
                                <p className="text-sm text-red-500 text-center">
                                    Código inválido ou expirado
                                </p>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("input")}
                                    disabled={changeEmailMutation.isPending}
                                    className="flex-1"
                                >
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
                                        "Reenviar"
                                    )}
                                </Button>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    ⏰ Este código expira em 15 minutos.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
