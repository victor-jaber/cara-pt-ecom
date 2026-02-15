import type { Express } from "express";
import { z } from "zod";
import { sendEmail } from "./email";
import { verificationCodeEmail } from "./email-templates/verification";
import {
    generateVerificationCode,
    createEmailVerification,
    getEmailVerification,
    markVerificationUsed,
    countRecentVerificationAttempts,
    cleanExpiredVerifications,
} from "./email-verification";
import { storage } from "./storage";

// Validation schemas
const sendVerificationCodeSchema = z.object({
    email: z.string().email("Email inválido"),
    type: z.enum(["registration", "email_change"]),
});

const verifyEmailCodeSchema = z.object({
    email: z.string().email("Email inválido"),
    code: z.string().length(6, "Código deve ter 6 dígitos"),
    type: z.enum(["registration", "email_change"]),
});

export function registerVerificationRoutes(app: Express) {
    // Clean up expired verifications on server start
    cleanExpiredVerifications().catch(console.error);

    // Send verification code endpoint
    app.post("/api/auth/send-verification-code", async (req, res) => {
        try {
            const validated = sendVerificationCodeSchema.parse(req.body);
            const { email, type } = validated;
            const normalizedEmail = email.trim().toLowerCase();

            // Rate limiting: max 3 codes per 15 minutes
            const recentAttempts = await countRecentVerificationAttempts(normalizedEmail, 15);
            if (recentAttempts >= 3) {
                return res.status(429).json({
                    message: "Demasiadas tentativas. Tente novamente em 15 minutos.",
                });
            }

            // For registration, check if email already exists
            if (type === "registration") {
                const existingUser = await storage.getUserByEmail(normalizedEmail);
                if (existingUser) {
                    return res.status(400).json({ message: "Este email já está registado" });
                }
            }

            // Generate and store verification code
            const code = generateVerificationCode();
            await createEmailVerification(normalizedEmail, code, type);

            // Send email
            await sendEmail({
                to: email.trim(),
                subject: type === "registration"
                    ? "Código de Verificação - Novo Registro"
                    : "Código de Verificação - Alteração de Email",
                html: verificationCodeEmail(code, type),
            });

            res.json({
                success: true,
                message: "Código de verificação enviado",
                expiresIn: 900, // 15 minutes in seconds
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
            }
            console.error("Error sending verification code:", error);
            res.status(500).json({ message: "Erro ao enviar código de verificação" });
        }
    });

    // Verify email code endpoint
    app.post("/api/auth/verify-email-code", async (req, res) => {
        try {
            const validated = verifyEmailCodeSchema.parse(req.body);
            const { email, code, type } = validated;
            const normalizedEmail = email.trim().toLowerCase();
            const normalizedCode = code.trim();

            // Get verification record
            const verification = await getEmailVerification(normalizedEmail, normalizedCode, type);

            if (!verification) {
                return res.status(400).json({ message: "Código inválido ou expirado" });
            }

            // Check expiration
            if (new Date() > new Date(verification.expiresAt)) {
                return res.status(400).json({ message: "Código expirado" });
            }

            // Mark as verified
            await markVerificationUsed(verification.id);

            res.json({
                success: true,
                message: "Email verificado com sucesso",
                verificationId: verification.id,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
            }
            console.error("Error verifying code:", error);
            res.status(500).json({ message: "Erro ao verificar código" });
        }
    });

    // Resend verification code (just calls send again with same logic)
    app.post("/api/auth/resend-verification-code", async (req, res) => {
        // Same as send-verification-code
        return app._router.handle(
            { ...req, url: "/api/auth/send-verification-code", method: "POST" },
            res,
            () => { }
        );
    });
}
