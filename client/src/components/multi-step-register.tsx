import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { saveAuthUser } from "@/lib/authPersistence";
import { VerificationStep } from "@/components/verification-step";
import { useLocationContext } from "@/contexts/LocationContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface MultiStepRegisterProps {
    formData: any;
    onBack: () => void;
}

type RegistrationStep = "email_verification" | "complete";

export function MultiStepRegister({ formData, onBack }: MultiStepRegisterProps) {
    const [step, setStep] = useState<RegistrationStep>("email_verification");
    const [verificationId, setVerificationId] = useState<string>("");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { location: userLocation, isInternational } = useLocationContext();
    const { t } = useLanguage();

    // Complete registration after email verification
    const registerMutation = useMutation({
        mutationFn: async () => {
            const dataWithLocation = {
                ...formData,
                location: userLocation || "portugal",
                verificationId, // Include verification ID
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

    const handleVerified = (verId: string) => {
        setVerificationId(verId);
        // Auto-complete registration after verification
        registerMutation.mutate();
    };

    return (
        <div>
            {step === "email_verification" && (
                <VerificationStep
                    email={formData.email}
                    type="registration"
                    onVerified={handleVerified}
                    onBack={onBack}
                />
            )}
        </div>
    );
}
