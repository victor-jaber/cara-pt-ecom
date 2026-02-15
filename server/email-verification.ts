import crypto from 'crypto';
import { db } from './db';
import { emailVerifications } from '@shared/schema';
import { eq, and, lt, gt, isNull } from 'drizzle-orm';

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function normalizeCode(code: string) {
    return code.trim();
}

// Generate secure 6-digit code
export function generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
}

// Create email verification record
export async function createEmailVerification(
    email: string,
    code: string,
    type: 'registration' | 'email_change',
    userId?: string
) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = normalizeCode(code);

    // Expiration: 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const [verification] = await db.insert(emailVerifications).values({
        email: normalizedEmail,
        code: normalizedCode,
        type,
        userId: userId || null,
        expiresAt,
    }).returning();

    return verification;
}

// Get verification by email and code
export async function getEmailVerification(
    email: string,
    code: string,
    type: 'registration' | 'email_change'
) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = normalizeCode(code);

    const [verification] = await db
        .select()
        .from(emailVerifications)
        .where(
            and(
                eq(emailVerifications.email, normalizedEmail),
                eq(emailVerifications.code, normalizedCode),
                eq(emailVerifications.type, type),
                isNull(emailVerifications.verifiedAt)  // Not yet used
            )
        );

    return verification;
}

// Mark verification as used
export async function markVerificationUsed(id: string) {
    await db
        .update(emailVerifications)
        .set({ verifiedAt: new Date() })
        .where(eq(emailVerifications.id, id));
}

// Clean up expired verifications
export async function cleanExpiredVerifications() {
    await db
        .delete(emailVerifications)
        .where(lt(emailVerifications.expiresAt, new Date()));
}

// Check if user has recent verification (rate limiting)
export async function hasRecentVerification(
    email: string,
    minutes: number = 15
): Promise<boolean> {
    const normalizedEmail = normalizeEmail(email);
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    const [recent] = await db
        .select()
        .from(emailVerifications)
        .where(
            and(
                eq(emailVerifications.email, normalizedEmail),
                gt(emailVerifications.createdAt, cutoff)
            )
        )
        .limit(1);

    return !!recent;
}

// Count verification attempts for rate limiting
export async function countRecentVerificationAttempts(
    email: string,
    minutes: number = 15
): Promise<number> {
    const normalizedEmail = normalizeEmail(email);
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    const results = await db
        .select()
        .from(emailVerifications)
        .where(
            and(
                eq(emailVerifications.email, normalizedEmail),
                gt(emailVerifications.createdAt, cutoff)
            )
        );

    return results.length;
}
