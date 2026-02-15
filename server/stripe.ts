import type { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { findShippingOptionOrNull, getHardcodedShippingOptions } from "./shipping";
import { sendEmail } from "./email";
import { orderConfirmedEmail, orderCreatedEmail } from "./email-templates/orders";

type PendingStripePayment = {
  userId: string;
  orderId: string;
  cartSnapshot: Array<{ productId: string; quantity: number; price: string; name: string }>;
  total: string;
  createdAt: number;
  shippingAddress: string;
  notes: string;
  shippingOptionId?: string;
  shippingCost?: string;
  shippingOptionName?: string;
  source: "server_cart" | "client_items";
};

const pendingStripePayments = new Map<string, PendingStripePayment>();

setInterval(() => {
  const now = Date.now();
  const expireTime = 30 * 60 * 1000;
  pendingStripePayments.forEach((p, paymentIntentId) => {
    if (now - p.createdAt > expireTime) {
      pendingStripePayments.delete(paymentIntentId);
    }
  });
}, 5 * 60 * 1000);

async function getStripeClient(): Promise<Stripe | null> {
  const settings = await storage.getStripeSettings();
  if (!settings || !settings.isEnabled || !settings.secretKey || !settings.publishableKey) return null;
  return new Stripe(settings.secretKey);
}

function toAmountCents(total: number): number {
  return Math.round(Number(total.toFixed(2)) * 100);
}

export async function createStripePaymentIntent(req: Request, res: Response) {
  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      return res.status(400).json({ message: "Stripe is not configured or enabled" });
    }

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      shippingOptionId,
      countryCode,
      region,
      shippingAddress = "",
      notes = "",
      items,
    } = (req.body || {}) as any;

    const cartSnapshot: PendingStripePayment["cartSnapshot"] = [];
    let subtotal = 0;
    let source: PendingStripePayment["source"] = "server_cart";

    if (Array.isArray(items) && items.length > 0) {
      source = "client_items";
      for (const item of items) {
        const product = await storage.getProductById(item.productId);
        if (!product) {
          return res.status(400).json({ message: "Product not found" });
        }
        if (!product.inStock) {
          return res.status(400).json({ message: `Product ${product.name} is out of stock` });
        }
        const quantity = Number(item.quantity) || 0;
        if (quantity <= 0) {
          return res.status(400).json({ message: "Invalid quantity" });
        }
        subtotal += parseFloat(product.price) * quantity;
        cartSnapshot.push({ productId: product.id, quantity, price: product.price, name: product.name });
      }
    } else {
      const cartItems = await storage.getCartItems(user.id);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      for (const item of cartItems) {
        const product = await storage.getProductById(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.product.name} is no longer available` });
        }
        if (!product.inStock) {
          return res.status(400).json({ message: `Product ${product.name} is out of stock` });
        }
        subtotal += parseFloat(product.price) * item.quantity;
        cartSnapshot.push({ productId: product.id, quantity: item.quantity, price: product.price, name: product.name });
      }
    }

    const availableShippingOptions = getHardcodedShippingOptions({
      countryCode,
      region,
      subtotal,
    });

    if (availableShippingOptions.length > 0 && !shippingOptionId) {
      return res.status(400).json({ message: "Shipping option is required" });
    }

    const selectedShipping = findShippingOptionOrNull(availableShippingOptions, shippingOptionId);
    if (shippingOptionId && !selectedShipping) {
      return res.status(400).json({ message: "Invalid shipping option for your location" });
    }

    const shippingCost = selectedShipping ? parseFloat(selectedShipping.price) : 0;
    const shippingOptionName: string | undefined = selectedShipping ? selectedShipping.name : undefined;

    const total = subtotal + shippingCost;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toAmountCents(total),
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user.id,
      },
    });

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
        paymentMethod: "stripe",
        paymentStatus: "pending",
        shippingOptionId: selectedShipping ? selectedShipping.id : null,
        shippingCost: shippingCost.toFixed(2),
        shippingOptionName: shippingOptionName || null,
        paymentMetadata: {
          stripePaymentIntentId: paymentIntent.id,
        },
      } as any,
      orderItems,
    );

    if (source === "server_cart") {
      await storage.clearCart(user.id);
    }

    // Send order created email (async, don't wait for it)
    sendEmail({
      to: user.email,
      subject: `Pedido #${order.id} criado`,
      html: orderCreatedEmail(order, user.firstName),
    }).catch((err) => console.error("Failed to send order created email:", err));

    pendingStripePayments.set(paymentIntent.id, {
      userId: user.id,
      orderId: order.id,
      cartSnapshot,
      total: total.toFixed(2),
      createdAt: Date.now(),
      shippingAddress,
      notes,
      shippingOptionId: selectedShipping ? selectedShipping.id : undefined,
      shippingCost: shippingCost.toFixed(2),
      shippingOptionName,
      source,
    });

    return res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Error creating Stripe payment intent:", error);
    return res.status(500).json({ message: "Failed to create Stripe payment intent" });
  }
}

export async function confirmStripePayment(req: Request, res: Response) {
  try {
    const stripe = await getStripeClient();
    if (!stripe) {
      return res.status(400).json({ message: "Stripe is not configured or enabled" });
    }

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { paymentIntentId } = (req.body || {}) as any;
    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId is required" });
    }

    const pending = pendingStripePayments.get(paymentIntentId);
    if (!pending) {
      return res.status(400).json({ message: "Stripe payment expired or not found. Please try again." });
    }

    if (pending.userId !== user.id) {
      return res.status(403).json({ message: "Unauthorized to confirm this payment" });
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const existingOrder = await storage.getOrderById(pending.orderId);
    if (!existingOrder) {
      pendingStripePayments.delete(paymentIntentId);
      return res.status(400).json({ message: "Order not found for this payment" });
    }

    const mergedMetadata = {
      ...((existingOrder as any).paymentMetadata || {}),
      stripePaymentIntentId: paymentIntentId,
    };

    const updatedOrder = await storage.updateOrderPayment(existingOrder.id, {
      status: "confirmed",
      paymentMethod: "stripe",
      paymentStatus: "completed",
      paymentMetadata: mergedMetadata,
    } as any);

    const orderForEmail = updatedOrder || existingOrder;

    pendingStripePayments.delete(paymentIntentId);

    // Send order confirmed email (async, don't wait for it)
    sendEmail({
      to: user.email,
      subject: `Pedido #${orderForEmail.id} confirmado`,
      html: orderConfirmedEmail(orderForEmail as any, user.firstName),
    }).catch(err => console.error('Failed to send order confirmed email:', err));

    return res.json({
      success: true,
      orderId: orderForEmail.id,
      paymentIntentId,
    });
  } catch (error: any) {
    console.error("Error confirming Stripe payment:", error);
    return res.status(500).json({ message: "Failed to confirm Stripe payment" });
  }
}
