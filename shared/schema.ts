import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userStatusEnum = pgEnum("user_status", ["pending", "approved", "rejected"]);
export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "shipped", "delivered", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const paypalModeEnum = pgEnum("paypal_mode", ["sandbox", "live"]);

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with approval system
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone").notNull(),
  profession: varchar("profession").notNull(),
  additionalInfo: text("additional_info"),
  nif: varchar("nif"),
  professionalLicense: varchar("professional_license"),
  specialty: varchar("specialty"),
  clinicName: varchar("clinic_name"),
  clinicAddress: text("clinic_address"),
  status: userStatusEnum("status").default("pending").notNull(),
  role: userRoleEnum("role").default("customer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Promotion rule type for quantity-based discounts
export type PromotionRule = {
  minQuantity: number;
  pricePerUnit: string;
};

// Products table
export const productCategories = ["soft", "mild", "hard", "ultra"] as const;
export type ProductCategory = typeof productCategories[number];

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  category: varchar("category").$type<ProductCategory>(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: varchar("image"),
  particleSize: varchar("particle_size"),
  needleSize: varchar("needle_size"),
  injectionDepth: varchar("injection_depth"),
  applicationZones: text("application_zones"),
  infodmCode: varchar("infodm_code"),
  inStock: boolean("in_stock").default(true),
  isActive: boolean("is_active").default(true).notNull(),
  promotionRules: jsonb("promotion_rules").$type<PromotionRule[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").default("pending").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: text("shipping_address"),
  shippingOptionId: varchar("shipping_option_id"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  shippingOptionName: varchar("shipping_option_name"),
  notes: text("notes"),
  paymentMethod: varchar("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paypalOrderId: varchar("paypal_order_id"),
  paypalCaptureId: varchar("paypal_capture_id"),
  paymentMetadata: jsonb("payment_metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PayPal Settings table (singleton)
export const paypalSettings = pgTable("paypal_settings", {
  id: varchar("id").primaryKey().default("default"),
  clientId: varchar("client_id"),
  clientSecret: varchar("client_secret"),
  mode: paypalModeEnum("mode").default("sandbox").notNull(),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"),
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipping options table
export const shippingOptions = pgTable("shipping_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  estimatedDays: varchar("estimated_days"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Registration schema for form validation (without passwordHash)
export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  phone: z.string().min(9, "Número de telemóvel inválido"),
  profession: z.string().min(1, "Selecione a sua profissão"),
  additionalInfo: z.string().optional(),
  acceptTerms: z.boolean(),
  location: z.enum(["portugal", "international"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As palavras-passe não coincidem",
  path: ["confirmPassword"],
}).refine((data) => data.acceptTerms === true, {
  message: "Deve aceitar as políticas de privacidade",
  path: ["acceptTerms"],
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Palavra-passe é obrigatória"),
  rememberMe: z.boolean().optional(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertPaypalSettingsSchema = createInsertSchema(paypalSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertShippingOptionSchema = createInsertSchema(shippingOptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Extended types for frontend
export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
  user?: User;
};

export type CartItemWithProduct = CartItem & {
  product: Product;
};

export type PaypalSettings = typeof paypalSettings.$inferSelect;
export type InsertPaypalSettings = z.infer<typeof insertPaypalSettingsSchema>;

export type ShippingOption = typeof shippingOptions.$inferSelect;
export type InsertShippingOption = z.infer<typeof insertShippingOptionSchema>;
