// DatabaseStorage (javascript_database + javascript_log_in_with_replit integrations)
import {
  users,
  products,
  orders,
  orderItems,
  cartItems,
  paypalSettings,
  shippingOptions,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type CartItem,
  type InsertCartItem,
  type OrderWithItems,
  type CartItemWithProduct,
  type PaypalSettings,
  type InsertPaypalSettings,
  type ShippingOption,
  type InsertShippingOption,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, "id">): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByStatus(status: "pending" | "approved" | "rejected"): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<User | undefined>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User | undefined>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  restoreProduct(id: string): Promise<Product | undefined>;
  permanentDeleteProduct(id: string): Promise<boolean>;

  // Cart operations
  getCartItems(userId: string): Promise<CartItemWithProduct[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;

  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrdersByUser(userId: string): Promise<OrderWithItems[]>;
  getOrderById(id: string): Promise<OrderWithItems | undefined>;
  getAllOrders(): Promise<OrderWithItems[]>;
  updateOrderStatus(id: string, status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"): Promise<Order | undefined>;
  updateOrderPayment(id: string, data: Partial<Order>): Promise<Order | undefined>;

  // PayPal settings operations
  getPaypalSettings(): Promise<PaypalSettings | undefined>;
  updatePaypalSettings(data: InsertPaypalSettings, updatedBy?: string): Promise<PaypalSettings>;

  // Shipping options operations
  getAllShippingOptions(): Promise<ShippingOption[]>;
  getActiveShippingOptions(): Promise<ShippingOption[]>;
  getShippingOptionById(id: string): Promise<ShippingOption | undefined>;
  createShippingOption(option: InsertShippingOption): Promise<ShippingOption>;
  updateShippingOption(id: string, option: Partial<InsertShippingOption>): Promise<ShippingOption | undefined>;
  deleteShippingOption(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, "id">): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByStatus(status: "pending" | "approved" | "rejected"): Promise<User[]> {
    return await db.select().from(users).where(eq(users.status, status)).orderBy(desc(users.createdAt));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getActiveProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.isActive, true)));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product as any).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() } as any)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const [updated] = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return !!updated;
  }

  async restoreProduct(id: string): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async permanentDeleteProduct(id: string): Promise<boolean> {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return !!deleted;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItemWithProduct[]> {
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId))
      .innerJoin(products, eq(cartItems.productId, products.id));
    
    return items.map(item => ({
      ...item.cart_items,
      product: item.products,
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId)));
    
    if (existing) {
      // Update quantity
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + (item.quantity || 1) })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    }

    const [newItem] = await db.insert(cartItems).values(item).returning();
    return newItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: string): Promise<boolean> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
    return true;
  }

  async clearCart(userId: string): Promise<boolean> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return true;
  }

  // Order operations
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    // Insert order items
    for (const item of items) {
      await db.insert(orderItems).values({ ...item, orderId: newOrder.id });
    }

    return newOrder;
  }

  async getOrdersByUser(userId: string): Promise<OrderWithItems[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems: OrderWithItems[] = [];
    
    for (const order of userOrders) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .innerJoin(products, eq(orderItems.productId, products.id));
      
      ordersWithItems.push({
        ...order,
        items: items.map(item => ({
          ...item.order_items,
          product: item.products,
        })),
      });
    }

    return ordersWithItems;
  }

  async getOrderById(id: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .innerJoin(products, eq(orderItems.productId, products.id));

    const [user] = await db.select().from(users).where(eq(users.id, order.userId));

    return {
      ...order,
      items: items.map(item => ({
        ...item.order_items,
        product: item.products,
      })),
      user,
    };
  }

  async getAllOrders(): Promise<OrderWithItems[]> {
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    const ordersWithItems: OrderWithItems[] = [];
    
    for (const order of allOrders) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .innerJoin(products, eq(orderItems.productId, products.id));
      
      const [user] = await db.select().from(users).where(eq(users.id, order.userId));
      
      ordersWithItems.push({
        ...order,
        items: items.map(item => ({
          ...item.order_items,
          product: item.products,
        })),
        user,
      });
    }

    return ordersWithItems;
  }

  async updateOrderStatus(id: string, status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderPayment(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  // PayPal settings operations
  async getPaypalSettings(): Promise<PaypalSettings | undefined> {
    const [settings] = await db.select().from(paypalSettings).where(eq(paypalSettings.id, "default"));
    return settings;
  }

  async updatePaypalSettings(data: InsertPaypalSettings, updatedBy?: string): Promise<PaypalSettings> {
    const [existing] = await db.select().from(paypalSettings).where(eq(paypalSettings.id, "default"));
    
    if (existing) {
      const [updated] = await db
        .update(paypalSettings)
        .set({ ...data, updatedAt: new Date(), updatedBy })
        .where(eq(paypalSettings.id, "default"))
        .returning();
      return updated;
    }
    
    const [created] = await db
      .insert(paypalSettings)
      .values({ ...data, id: "default", updatedBy })
      .returning();
    return created;
  }

  // Shipping options operations
  async getAllShippingOptions(): Promise<ShippingOption[]> {
    return await db.select().from(shippingOptions).orderBy(shippingOptions.sortOrder);
  }

  async getActiveShippingOptions(): Promise<ShippingOption[]> {
    return await db
      .select()
      .from(shippingOptions)
      .where(eq(shippingOptions.isActive, true))
      .orderBy(shippingOptions.sortOrder);
  }

  async getShippingOptionById(id: string): Promise<ShippingOption | undefined> {
    const [option] = await db.select().from(shippingOptions).where(eq(shippingOptions.id, id));
    return option;
  }

  async createShippingOption(option: InsertShippingOption): Promise<ShippingOption> {
    const [newOption] = await db.insert(shippingOptions).values(option).returning();
    return newOption;
  }

  async updateShippingOption(id: string, option: Partial<InsertShippingOption>): Promise<ShippingOption | undefined> {
    const [updated] = await db
      .update(shippingOptions)
      .set({ ...option, updatedAt: new Date() })
      .where(eq(shippingOptions.id, id))
      .returning();
    return updated;
  }

  async deleteShippingOption(id: string): Promise<boolean> {
    await db.delete(shippingOptions).where(eq(shippingOptions.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
