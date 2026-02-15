import {
  Client,
  Environment,
  LogLevel,
  OrdersController,
  CheckoutPaymentIntent,
} from "@paypal/paypal-server-sdk";
import { storage } from "./storage";
import type { Request, Response } from "express";
import { findShippingOptionOrNull, getHardcodedShippingOptions } from "./shipping";
import { sendEmail } from "./email";
import { orderConfirmedEmail, orderCreatedEmail } from "./email-templates/orders";

let cachedClient: Client | null = null;
let cachedSettings: { clientId: string; mode: string } | null = null;

interface PendingPayPalOrder {
  userId: string;
  orderId: string;
  cartSnapshot: Array<{
    productId: string;
    quantity: number;
    price: string;
    name: string;
  }>;
  total: string;
  createdAt: number;
  shippingOptionId?: string;
  shippingCost?: string;
  shippingOptionName?: string;
}

const pendingPayPalOrders = new Map<string, PendingPayPalOrder>();

setInterval(() => {
  const now = Date.now();
  const expireTime = 30 * 60 * 1000;
  pendingPayPalOrders.forEach((order, orderId) => {
    if (now - order.createdAt > expireTime) {
      pendingPayPalOrders.delete(orderId);
    }
  });
}, 5 * 60 * 1000);

async function getPayPalClient(): Promise<Client | null> {
  const settings = await storage.getPaypalSettings();
  
  if (!settings || !settings.isEnabled || !settings.clientId || !settings.clientSecret) {
    return null;
  }

  if (cachedClient && cachedSettings?.clientId === settings.clientId && cachedSettings?.mode === settings.mode) {
    return cachedClient;
  }

  cachedClient = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: settings.clientId,
      oAuthClientSecret: settings.clientSecret,
    },
    timeout: 0,
    environment: settings.mode === "live" ? Environment.Production : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: { logBody: true },
      logResponse: { logHeaders: true },
    },
  });

  cachedSettings = { clientId: settings.clientId, mode: settings.mode };
  return cachedClient;
}

export function clearPayPalClientCache() {
  cachedClient = null;
  cachedSettings = null;
}

export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    const settings = await storage.getPaypalSettings();
    
    if (!settings || !settings.isEnabled || !settings.clientId) {
      return res.json({ clientId: null, enabled: false, mode: "sandbox" });
    }

    return res.json({ 
      clientId: settings.clientId, 
      enabled: true, 
      mode: settings.mode || "sandbox" 
    });
  } catch (error) {
    console.error("Error loading PayPal settings:", error);
    return res.status(500).json({ error: "Failed to load PayPal configuration" });
  }
}

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const client = await getPayPalClient();
    
    if (!client) {
      return res.status(400).json({ error: "PayPal is not configured or enabled" });
    }

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { shippingOptionId, countryCode, region, shippingAddress = "", notes = "" } = req.body || {};

    const cartItems = await storage.getCartItems(user.id);
    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const cartSnapshot: PendingPayPalOrder["cartSnapshot"] = [];
    let subtotal = 0;

    for (const item of cartItems) {
      const product = await storage.getProductById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.product.name} is no longer available` });
      }
      if (!product.inStock) {
        return res.status(400).json({ error: `Product ${product.name} is out of stock` });
      }

      const itemPrice = parseFloat(product.price);
      subtotal += itemPrice * item.quantity;

      cartSnapshot.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        name: product.name,
      });
    }

    const availableShippingOptions = getHardcodedShippingOptions({
      countryCode,
      region,
      subtotal,
    });

    if (availableShippingOptions.length > 0 && !shippingOptionId) {
      return res.status(400).json({ error: "Shipping option is required" });
    }

    const selectedShipping = findShippingOptionOrNull(availableShippingOptions, shippingOptionId);
    if (shippingOptionId && !selectedShipping) {
      return res.status(400).json({ error: "Invalid shipping option for your location" });
    }

    const shippingCost = selectedShipping ? parseFloat(selectedShipping.price) : 0;
    const shippingOptionName: string | undefined = selectedShipping ? selectedShipping.name : undefined;

    const total = subtotal + shippingCost;

    const ordersController = new OrdersController(client);

    const response = await ordersController.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            amount: {
              currencyCode: "EUR",
              value: total.toFixed(2),
            },
          },
        ],
      },
      prefer: "return=minimal",
    });

    const paypalOrderId = (response.result as any).id;

    const orderItems = cartSnapshot.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      orderId: "",
    }));

    const order = await storage.createOrder(
      {
        userId: user.id,
        total: total.toFixed(2),
        shippingAddress: shippingAddress || user.clinicAddress || "",
        notes: notes || "",
        status: "pending",
        paymentMethod: "paypal",
        paymentStatus: "pending",
        paypalOrderId,
        shippingOptionId: shippingOptionId || null,
        shippingCost: shippingCost.toFixed(2),
        shippingOptionName: shippingOptionName || null,
        paymentMetadata: {
          paypalOrderId,
        },
      } as any,
      orderItems,
    );

    await storage.clearCart(user.id);

    // Send order created email (async, don't wait for it)
    sendEmail({
      to: user.email,
      subject: `Pedido #${order.id} criado`,
      html: orderCreatedEmail(order, user.firstName),
    }).catch((err) => console.error("Failed to send order created email:", err));
    
    pendingPayPalOrders.set(paypalOrderId, {
      userId: user.id,
      orderId: order.id,
      cartSnapshot,
      total: total.toFixed(2),
      createdAt: Date.now(),
      shippingOptionId,
      shippingCost: shippingCost.toFixed(2),
      shippingOptionName,
    });

    return res.json(response.result);
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return res.status(500).json({ error: "Failed to create PayPal order" });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const client = await getPayPalClient();
    
    if (!client) {
      return res.status(400).json({ error: "PayPal is not configured or enabled" });
    }

    const { orderID } = req.params;
    const user = (req as any).user;

    if (!orderID) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const pendingOrder = pendingPayPalOrders.get(orderID);
    if (!pendingOrder) {
      return res.status(400).json({ error: "PayPal order expired or not found. Please try again." });
    }

    if (pendingOrder.userId !== user.id) {
      return res.status(403).json({ error: "Unauthorized to capture this order" });
    }

    for (const item of pendingOrder.cartSnapshot) {
      const product = await storage.getProductById(item.productId);
      if (!product) {
        pendingPayPalOrders.delete(orderID);
        return res.status(400).json({ error: `Product ${item.name} is no longer available` });
      }
      if (!product.inStock) {
        pendingPayPalOrders.delete(orderID);
        return res.status(400).json({ error: `Product ${product.name} is out of stock` });
      }
    }

    const ordersController = new OrdersController(client);

    const response = await ordersController.captureOrder({
      id: orderID,
      prefer: "return=representation",
    });

    const captureResult = response.result as any;
    const captureId = captureResult?.purchaseUnits?.[0]?.payments?.captures?.[0]?.id || "";
    const payerEmail = captureResult?.payer?.emailAddress || "";

    const { shippingAddress = "", notes = "" } = req.body || {};

    const existingOrder = await storage.getOrderById(pendingOrder.orderId);
    if (!existingOrder) {
      pendingPayPalOrders.delete(orderID);
      return res.status(400).json({ error: "Order not found for this PayPal order" });
    }

    const mergedMetadata = {
      ...((existingOrder as any).paymentMetadata || {}),
      paypalOrderId: orderID,
      paypalCaptureId: captureId,
      payerEmail,
    };

    const updatedOrder = await storage.updateOrderPayment(existingOrder.id, {
      status: "confirmed",
      paymentMethod: "paypal",
      paymentStatus: "completed",
      paypalOrderId: orderID,
      paypalCaptureId: captureId,
      shippingAddress: shippingAddress || existingOrder.shippingAddress || user.clinicAddress || "",
      notes: notes || existingOrder.notes || "",
      shippingOptionId: pendingOrder.shippingOptionId || existingOrder.shippingOptionId || null,
      shippingCost: pendingOrder.shippingCost || (existingOrder as any).shippingCost || "0.00",
      shippingOptionName: pendingOrder.shippingOptionName || existingOrder.shippingOptionName || null,
      paymentMetadata: mergedMetadata,
    } as any);

    const orderForEmail = updatedOrder || existingOrder;

    // Send order confirmed email (async, don't wait for it)
    sendEmail({
      to: user.email,
      subject: `Pedido #${orderForEmail.id} confirmado`,
      html: orderConfirmedEmail(orderForEmail as any, user.firstName),
    }).catch((err) => console.error("Failed to send order confirmed email:", err));

    pendingPayPalOrders.delete(orderID);

    return res.json({
      success: true,
      orderId: orderForEmail.id,
      paypalOrderId: orderID,
      paypalCaptureId: captureId,
      payerEmail,
    });
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    return res.status(500).json({ error: "Failed to capture PayPal order" });
  }
}
