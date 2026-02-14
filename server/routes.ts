import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, hashPassword, verifyPassword } from "./auth";
import { insertProductSchema, registerSchema, loginSchema, insertPaypalSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault, clearPayPalClientCache } from "./paypal";
import { confirmStripePayment, createStripePaymentIntent } from "./stripe";
import { createEupagoMbwayOrder, createEupagoMultibancoOrder, handleEupagoWebhook } from "./eupago";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { findShippingOptionOrNull, getHardcodedShippingOptions } from "./shipping";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validated = registerSchema.parse(req.body);
      
      // Enforce terms acceptance - required for GDPR compliance
      if (!validated.acceptTerms) {
        return res.status(400).json({ message: "Deve aceitar as políticas de privacidade" });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está registado" });
      }

      // Hash password
      const passwordHash = await hashPassword(validated.password);

      // Auto-approve international users
      const userStatus = validated.location === "international" ? "approved" : "pending";

      // Create user
      const user = await storage.createUser({
        email: validated.email,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
        profession: validated.profession,
        additionalInfo: validated.additionalInfo || null,
        status: userStatus,
        role: "customer",
      });

      // Regenerate session to ensure new cookie is sent
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({ message: "Falha ao criar sessão" });
        }
        
        req.session.userId = user.id;
        
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ message: "Falha ao criar sessão" });
          }
          res.json({ 
            success: true, 
            user: { ...user, passwordHash: undefined } 
          });
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Falha ao registar utilizador" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(validated.email);
      if (!user) {
        return res.status(401).json({ message: "Email ou palavra-passe incorretos" });
      }

      const isValid = await verifyPassword(validated.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Email ou palavra-passe incorretos" });
      }

      // Regenerate session to ensure new cookie is sent
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({ message: "Falha ao criar sessão" });
        }
        
        req.session.userId = user.id;
        
        // Adjust session cookie duration based on "remember me" checkbox
        if (req.session.cookie) {
          if (validated.rememberMe) {
            // Remember me: 30 days
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
          } else {
            // Session only: expires when browser closes (set very short maxAge to trigger session cookie behavior)
            req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day as fallback
            req.session.cookie.expires = false as any; // Session cookie - expires on browser close
          }
        }
        
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ message: "Falha ao criar sessão" });
          }
          res.json({ 
            success: true, 
            user: { ...user, passwordHash: undefined } 
          });
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Falha ao iniciar sessão" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Falha ao terminar sessão" });
      }
      res.json({ success: true });
    });
  });

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      // Always return success to prevent email enumeration attacks
      // In production, this would send an email if the user exists
      console.log(`Password reset requested for: ${email}`);
      
      // TODO: Implement actual email sending with SMTP
      // const user = await storage.getUserByEmail(email);
      // if (user) {
      //   const token = generateResetToken();
      //   await storage.saveResetToken(user.id, token);
      //   await sendResetEmail(user.email, token);
      // }

      res.json({ 
        success: true, 
        message: "Se existir uma conta com este email, receberá instruções para redefinir a sua palavra-passe." 
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Falha ao processar pedido" });
    }
  });

  // Get current user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({ ...user, passwordHash: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Middleware to check if user is approved
  const isApproved = async (req: any, res: any, next: any) => {
    try {
      const user = req.user;
      if (!user || user.status !== "approved") {
        return res.status(403).json({ message: "Account not approved" });
      }
      req.dbUser = user;
      next();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };

  // Middleware to check if user is admin
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const user = req.user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      req.dbUser = user;
      next();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };

  // Admin uploads (store file, return URL string)
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : ".png";
        cb(null, `${Date.now()}-${crypto.randomUUID()}${safeExt}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype?.startsWith("image/")) {
        return cb(new Error("Invalid file type"));
      }
      cb(null, true);
    },
  });

  app.post("/api/admin/uploads", isAuthenticated, isAdmin, (req, res) => {
    upload.single("image")(req as any, res as any, (err: any) => {
      if (err) {
        const message = err?.message || "Upload failed";
        return res.status(400).json({ message });
      }

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      res.json({ url: `/uploads/${file.filename}` });
    });
  });

  // Public products endpoint (for landing page preview)
  app.get("/api/products/preview", async (req, res) => {
    try {
      const allProducts = await storage.getActiveProducts();
      res.json(allProducts.slice(0, 4));
    } catch (error) {
      console.error("Error fetching products preview:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Products routes (public - both international guests and approved Portugal users can view)
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes (protected - requires approval)
  app.get("/api/cart", isAuthenticated, isApproved, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const items = await storage.getCartItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", isAuthenticated, isApproved, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { productId, quantity } = req.body;
      
      if (!productId) {
        return res.status(400).json({ message: "Product ID required" });
      }

      const item = await storage.addToCart({
        userId,
        productId,
        quantity: quantity || 1,
      });
      res.json(item);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, isApproved, async (req: any, res) => {
    try {
      const { quantity } = req.body;
      if (typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({ message: "Valid quantity required" });
      }

      const item = await storage.updateCartItem(req.params.id, quantity);
      if (!item) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({ message: "Failed to update cart" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, isApproved, async (req: any, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart", isAuthenticated, isApproved, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.clearCart(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders routes (protected - requires approval)
  app.get("/api/orders", isAuthenticated, isApproved, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, isApproved, async (req: any, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      // Check if user owns this order
      const userId = req.user.id;
      if (order.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", isAuthenticated, isApproved, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { shippingAddress, notes, shippingOptionId, countryCode, region } = req.body;

      // Get cart items with product data from database (prices are authoritative from DB)
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Verify all products exist and are in stock
      const orderItems = [];
      let calculatedTotal = 0;

      for (const item of cartItems) {
        // Fetch fresh product data to ensure current pricing
        const product = await storage.getProductById(item.productId);
        if (!product) {
          return res.status(400).json({ 
            message: `Product ${item.product.name} is no longer available` 
          });
        }
        if (!product.inStock) {
          return res.status(400).json({ 
            message: `Product ${product.name} is out of stock` 
          });
        }

        // Use authoritative product price from database
        const itemPrice = parseFloat(product.price);
        calculatedTotal += itemPrice * item.quantity;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price, // Price from database, not client
          orderId: "", // Will be set in createOrder
        });
      }

      const availableShippingOptions = getHardcodedShippingOptions({
        countryCode,
        region,
        subtotal: calculatedTotal,
      });

      if (availableShippingOptions.length > 0 && !shippingOptionId) {
        return res.status(400).json({ message: "Shipping option is required" });
      }

      const selectedShipping = findShippingOptionOrNull(availableShippingOptions, shippingOptionId);
      if (shippingOptionId && !selectedShipping) {
        return res.status(400).json({ message: "Invalid shipping option for your location" });
      }

      const shippingCost = selectedShipping ? parseFloat(selectedShipping.price) : 0;
      const shippingOptionName = selectedShipping ? selectedShipping.name : null;
      const validShippingOptionId = selectedShipping ? selectedShipping.id : null;

      // Create order with server-calculated total including shipping
      const order = await storage.createOrder(
        {
          userId,
          total: (calculatedTotal + shippingCost).toFixed(2),
          shippingAddress,
          notes,
          status: "pending",
          shippingOptionId: validShippingOptionId,
          shippingCost: shippingCost.toFixed(2),
          shippingOptionName,
        },
        orderItems
      );

      // Clear cart after successful order
      await storage.clearCart(userId);

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // International user orders route (bypasses session cookies)
  app.get("/api/international-orders/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching international orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // International authenticated orders route (bypasses session cookies)
  app.post("/api/international-orders", async (req, res) => {
    try {
      const { userId, shippingAddress, notes, shippingOptionId, items, countryCode, region } = req.body;

      // Validate required fields
      if (!userId || !shippingAddress) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items in order" });
      }

      // Verify user exists and is approved
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (user.status !== "approved") {
        return res.status(403).json({ message: "Account not approved" });
      }

      // Verify all products and calculate total using authoritative prices
      const orderItems = [];
      let calculatedTotal = 0;

      for (const item of items) {
        const product = await storage.getProductById(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product not found` });
        }
        if (!product.inStock) {
          return res.status(400).json({ message: `Product ${product.name} is out of stock` });
        }

        const itemPrice = parseFloat(product.price);
        calculatedTotal += itemPrice * item.quantity;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          orderId: "",
        });
      }

      const availableShippingOptions = getHardcodedShippingOptions({
        countryCode,
        region,
        subtotal: calculatedTotal,
      });

      if (availableShippingOptions.length > 0 && !shippingOptionId) {
        return res.status(400).json({ message: "Shipping option is required" });
      }

      const selectedShipping = findShippingOptionOrNull(availableShippingOptions, shippingOptionId);
      if (shippingOptionId && !selectedShipping) {
        return res.status(400).json({ message: "Invalid shipping option for your location" });
      }

      const shippingCost = selectedShipping ? parseFloat(selectedShipping.price) : 0;
      const shippingOptionName = selectedShipping ? selectedShipping.name : null;
      const validShippingOptionId = selectedShipping ? selectedShipping.id : null;

      // Create order
      const order = await storage.createOrder(
        {
          userId: user.id,
          total: (calculatedTotal + shippingCost).toFixed(2),
          shippingAddress,
          notes: notes || "",
          status: "pending",
          shippingOptionId: validShippingOptionId,
          shippingCost: shippingCost.toFixed(2),
          shippingOptionName,
        },
        orderItems
      );

      res.json(order);
    } catch (error) {
      console.error("Error creating international order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Guest orders route (for international users who confirmed they are medical professionals)
  app.post("/api/guest-orders", async (req, res) => {
    try {
      const { guestName, guestEmail, guestPhone, shippingAddress, notes, shippingOptionId, items, countryCode, region } = req.body;

      // Validate required fields
      if (!guestName || !guestEmail || !guestPhone || !shippingAddress) {
        return res.status(400).json({ message: "Missing required guest information" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items in order" });
      }

      // Get or create guest user
      let guestUser = await storage.getUserByEmail("guest@cara-fillers.com");
      if (!guestUser) {
        guestUser = await storage.createUser({
          email: "guest@cara-fillers.com",
          passwordHash: "guest-no-login-disabled",
          firstName: "Guest",
          lastName: "User",
          profession: "international",
          phone: "",
          role: "customer",
          status: "approved",
        });
      }

      // Verify all products and calculate total using authoritative prices
      const orderItems = [];
      let calculatedTotal = 0;

      for (const item of items) {
        const product = await storage.getProductById(item.productId);
        if (!product) {
          return res.status(400).json({ 
            message: `Product not found` 
          });
        }
        if (!product.inStock) {
          return res.status(400).json({ 
            message: `Product ${product.name} is out of stock` 
          });
        }

        const itemPrice = parseFloat(product.price);
        calculatedTotal += itemPrice * item.quantity;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          orderId: "",
        });
      }

      const availableShippingOptions = getHardcodedShippingOptions({
        countryCode,
        region,
        subtotal: calculatedTotal,
      });

      if (availableShippingOptions.length > 0 && !shippingOptionId) {
        return res.status(400).json({ message: "Shipping option is required" });
      }

      const selectedShipping = findShippingOptionOrNull(availableShippingOptions, shippingOptionId);
      if (shippingOptionId && !selectedShipping) {
        return res.status(400).json({ message: "Invalid shipping option for your location" });
      }

      const shippingCost = selectedShipping ? parseFloat(selectedShipping.price) : 0;
      const shippingOptionName = selectedShipping ? selectedShipping.name : null;
      const validShippingOptionId = selectedShipping ? selectedShipping.id : null;

      // Create order with guest info stored in paymentMetadata
      const order = await storage.createOrder(
        {
          userId: guestUser.id,
          total: (calculatedTotal + shippingCost).toFixed(2),
          shippingAddress,
          notes: notes || "",
          status: "pending",
          shippingOptionId: validShippingOptionId,
          shippingCost: shippingCost.toFixed(2),
          shippingOptionName,
          paymentMetadata: {
            isGuestOrder: true,
            guestName,
            guestEmail,
            guestPhone,
          },
        },
        orderItems
      );

      res.json(order);
    } catch (error) {
      console.error("Error creating guest order:", error);
      res.status(500).json({ message: "Failed to create guest order" });
    }
  });

  // User profile update
  app.patch("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { phone, nif, professionalLicense, specialty, clinicName, clinicAddress } = req.body;

      const user = await storage.updateUserProfile(userId, {
        phone,
        nif,
        professionalLicense,
        specialty,
        clinicName,
        clinicAddress,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/pending", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersByStatus("pending");
      res.json(users);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.patch("/api/admin/users/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const user = await storage.updateUserStatus(req.params.id, status);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.get("/api/admin/orders", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "confirmed", "shipped", "delivered", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Admin product management
  app.post("/api/admin/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validated);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const existingProduct = await storage.getProductById(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const uploadsRoot = path.resolve(process.cwd(), "uploads");
      const oldImage = existingProduct.image;
      const newImage = (req.body as any)?.image as string | null | undefined;

      const oldIsLocalUpload = typeof oldImage === "string" && oldImage.startsWith("/uploads/");
      const isChangingImage = newImage !== undefined && newImage !== oldImage;

      if (oldIsLocalUpload && isChangingImage) {
        const oldFilename = path.basename(oldImage);
        const oldPath = path.resolve(uploadsRoot, oldFilename);
        if (oldPath.startsWith(uploadsRoot + path.sep)) {
          try {
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          } catch (e) {
            console.warn("Failed to delete old product image:", e);
          }
        }
      }

      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true, message: "Produto arquivado com sucesso" });
    } catch (error) {
      console.error("Error archiving product:", error);
      res.status(500).json({ message: "Failed to archive product" });
    }
  });

  app.post("/api/admin/products/:id/restore", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const product = await storage.restoreProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error restoring product:", error);
      res.status(500).json({ message: "Failed to restore product" });
    }
  });

  app.delete("/api/admin/products/:id/permanent", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const deleted = await storage.permanentDeleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ success: true, message: "Produto eliminado permanentemente" });
    } catch (error: any) {
      console.error("Error permanently deleting product:", error);
      if (error?.code === '23503') {
        return res.status(400).json({ 
          message: "Este produto não pode ser eliminado porque faz parte de encomendas existentes. Mantenha-o arquivado para preservar o histórico." 
        });
      }
      res.status(500).json({ message: "Failed to permanently delete product" });
    }
  });

  // Admin endpoint to get all products (including inactive)
  app.get("/api/admin/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching all products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Contact form (public)
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email and message are required" });
      }

      // In a real app, you would send an email or store the message
      console.log("Contact form submission:", { name, email, subject, message });
      
      res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", isAuthenticated, isApproved, async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", isAuthenticated, isApproved, async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Stripe routes
  app.post("/api/stripe/payment-intent", isAuthenticated, isApproved, async (req, res) => {
    await createStripePaymentIntent(req, res);
  });

  app.post("/api/stripe/confirm", isAuthenticated, isApproved, async (req, res) => {
    await confirmStripePayment(req, res);
  });

  // EuPago routes (Portugal only)
  app.post("/api/eupago/multibanco", isAuthenticated, isApproved, async (req, res) => {
    await createEupagoMultibancoOrder(req, res);
  });

  app.post("/api/eupago/mbway", isAuthenticated, isApproved, async (req, res) => {
    await createEupagoMbwayOrder(req, res);
  });

  // EuPago webhook (public)
  app.all("/api/eupago/webhook", async (req, res) => {
    await handleEupagoWebhook(req, res);
  });

  // Admin PayPal settings routes
  app.get("/api/admin/paypal-settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getPaypalSettings();
      if (!settings) {
        return res.json({ clientId: "", clientSecret: "", mode: "sandbox", isEnabled: false });
      }
      res.json({
        clientId: settings.clientId || "",
        clientSecret: settings.clientSecret ? "********" : "",
        mode: settings.mode,
        isEnabled: settings.isEnabled,
        hasSecret: !!settings.clientSecret,
      });
    } catch (error) {
      console.error("Error fetching PayPal settings:", error);
      res.status(500).json({ message: "Failed to fetch PayPal settings" });
    }
  });

  app.post("/api/admin/paypal-settings", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { clientId, clientSecret, mode, isEnabled } = req.body;
      
      const currentSettings = await storage.getPaypalSettings();
      
      const updateData: any = {
        clientId,
        mode,
        isEnabled,
      };
      
      if (clientSecret && clientSecret !== "********") {
        updateData.clientSecret = clientSecret;
      } else if (currentSettings?.clientSecret) {
        updateData.clientSecret = currentSettings.clientSecret;
      }

      const settings = await storage.updatePaypalSettings(updateData, req.user.id);
      
      clearPayPalClientCache();
      
      res.json({
        clientId: settings.clientId || "",
        clientSecret: settings.clientSecret ? "********" : "",
        mode: settings.mode,
        isEnabled: settings.isEnabled,
        hasSecret: !!settings.clientSecret,
      });
    } catch (error) {
      console.error("Error updating PayPal settings:", error);
      res.status(500).json({ message: "Failed to update PayPal settings" });
    }
  });

  // Payment methods setup (public)
  app.get("/api/payment-methods/setup", async (_req, res) => {
    try {
      const paypal = await storage.getPaypalSettings();
      const stripe = await storage.getStripeSettings();
      const eupago = await storage.getEupagoSettings();

      res.json({
        paypal: {
          enabled: !!(paypal?.isEnabled && paypal?.clientId),
          clientId: paypal?.clientId || null,
          mode: paypal?.mode || "sandbox",
        },
        stripe: {
          enabled: !!(stripe?.isEnabled && stripe?.publishableKey && stripe?.secretKey),
          publishableKey: stripe?.publishableKey || null,
          mode: stripe?.mode || "test",
        },
        eupago: {
          enabled: !!(eupago?.isEnabled && eupago?.apiKey),
          mode: eupago?.mode || "sandbox",
        },
      });
    } catch (error) {
      console.error("Error loading payment methods setup:", error);
      res.status(500).json({ message: "Failed to load payment methods setup" });
    }
  });

  // Admin payment methods settings (unified)
  app.get("/api/admin/payment-methods", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const paypal = await storage.getPaypalSettings();
      const stripe = await storage.getStripeSettings();
      const eupago = await storage.getEupagoSettings();

      const reveal = String((req.query as any)?.reveal || "").toLowerCase();
      const shouldReveal = reveal === "1" || reveal === "true" || reveal === "yes";

      // Sensitive response (even masked); avoid intermediary caching.
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Pragma", "no-cache");

      res.json({
        paypal: {
          clientId: paypal?.clientId || "",
          clientSecret: shouldReveal ? (paypal?.clientSecret || "") : (paypal?.clientSecret ? "********" : ""),
          mode: paypal?.mode || "sandbox",
          isEnabled: paypal?.isEnabled || false,
          hasSecret: !!paypal?.clientSecret,
        },
        stripe: {
          publishableKey: stripe?.publishableKey || "",
          secretKey: shouldReveal ? (stripe?.secretKey || "") : (stripe?.secretKey ? "********" : ""),
          mode: stripe?.mode || "test",
          isEnabled: stripe?.isEnabled || false,
          hasSecret: !!stripe?.secretKey,
        },
        eupago: {
          apiKey: shouldReveal ? (eupago?.apiKey || "") : (eupago?.apiKey ? "********" : ""),
          mode: eupago?.mode || "sandbox",
          isEnabled: eupago?.isEnabled || false,
          hasSecret: !!eupago?.apiKey,
        },
      });
    } catch (error) {
      console.error("Error fetching payment methods settings:", error);
      res.status(500).json({ message: "Failed to fetch payment methods settings" });
    }
  });

  app.post("/api/admin/payment-methods", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { paypal, stripe, eupago } = req.body || {};

      const currentPaypal = await storage.getPaypalSettings();
      const currentStripe = await storage.getStripeSettings();
      const currentEupago = await storage.getEupagoSettings();

      if (paypal) {
        const updateData: any = {
          clientId: paypal.clientId,
          mode: paypal.mode,
          isEnabled: !!paypal.isEnabled,
        };
        if (paypal.clientSecret && paypal.clientSecret !== "********") {
          updateData.clientSecret = paypal.clientSecret;
        } else if (currentPaypal?.clientSecret) {
          updateData.clientSecret = currentPaypal.clientSecret;
        }
        await storage.updatePaypalSettings(updateData, req.user.id);
        clearPayPalClientCache();
      }

      if (stripe) {
        const updateData: any = {
          publishableKey: stripe.publishableKey,
          mode: stripe.mode,
          isEnabled: !!stripe.isEnabled,
        };
        if (stripe.secretKey && stripe.secretKey !== "********") {
          updateData.secretKey = stripe.secretKey;
        } else if (currentStripe?.secretKey) {
          updateData.secretKey = currentStripe.secretKey;
        }
        await storage.updateStripeSettings(updateData, req.user.id);
      }

      if (eupago) {
        const updateData: any = {
          mode: eupago.mode,
          isEnabled: !!eupago.isEnabled,
        };
        if (eupago.apiKey && eupago.apiKey !== "********") {
          updateData.apiKey = String(eupago.apiKey).trim();
        } else if (currentEupago?.apiKey) {
          updateData.apiKey = currentEupago.apiKey;
        }
        await storage.updateEupagoSettings(updateData, req.user.id);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating payment methods settings:", error);
      res.status(500).json({ message: "Failed to update payment methods settings" });
    }
  });

  // Shipping options routes (public - for checkout)
  app.get("/api/shipping-options", async (req, res) => {
    try {
      const countryCode = typeof req.query.countryCode === "string" ? req.query.countryCode : null;
      const region = typeof req.query.region === "string" ? req.query.region : null;
      const subtotalRaw = typeof req.query.subtotal === "string" ? req.query.subtotal : "0";
      const subtotal = Number.isFinite(parseFloat(subtotalRaw)) ? parseFloat(subtotalRaw) : 0;

      const options = getHardcodedShippingOptions({ countryCode, region, subtotal });
      res.json(options);
    } catch (error) {
      console.error("Error fetching shipping options:", error);
      res.status(500).json({ message: "Failed to fetch shipping options" });
    }
  });

  // Admin shipping options routes are disabled (hardcoded shipping rules)
  app.get("/api/admin/shipping-options", isAuthenticated, isAdmin, async (_req, res) => {
    res.status(410).json({ message: "Shipping options are hardcoded and cannot be edited." });
  });
  app.post("/api/admin/shipping-options", isAuthenticated, isAdmin, async (_req, res) => {
    res.status(410).json({ message: "Shipping options are hardcoded and cannot be edited." });
  });
  app.patch("/api/admin/shipping-options/:id", isAuthenticated, isAdmin, async (_req, res) => {
    res.status(410).json({ message: "Shipping options are hardcoded and cannot be edited." });
  });
  app.delete("/api/admin/shipping-options/:id", isAuthenticated, isAdmin, async (_req, res) => {
    res.status(410).json({ message: "Shipping options are hardcoded and cannot be edited." });
  });

  return httpServer;
}
