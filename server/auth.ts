import bcrypt from "bcrypt";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  // Replit always uses HTTPS, so we need secure cookies even in development
  const isReplit = !!(process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT);
  const isProduction = process.env.NODE_ENV === "production";
  const useSecureCookies = isProduction || isReplit;
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: useSecureCookies ? "none" as const : "lax" as const,
      maxAge: sessionTtl,
    },
  });
}

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function setupAuth(app: Express) {
  // Trust proxy in production or Replit environment
  const isReplit = !!(process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT);
  if (process.env.NODE_ENV === "production" || isReplit) {
    app.set("trust proxy", 1);
  }
  app.use(getSession());
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Try session first
  let userId = req.session.userId;
  
  // Fallback to Authorization header (for environments where cookies don't work)
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      userId = authHeader.substring(7);
    }
  }
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      if (req.session.userId) {
        req.session.destroy(() => {});
      }
      return res.status(401).json({ message: "Unauthorized" });
    }
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
