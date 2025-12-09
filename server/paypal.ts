import {
  Client,
  Environment,
  LogLevel,
  OrdersController,
  CheckoutPaymentIntent,
} from "@paypal/paypal-server-sdk";
import { storage } from "./storage";
import type { Request, Response } from "express";

let cachedClient: Client | null = null;
let cachedSettings: { clientId: string; mode: string } | null = null;

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
      return res.status(400).json({ error: "PayPal is not configured or enabled" });
    }

    return res.json({ clientId: settings.clientId });
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

    const { cart } = req.body;
    
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is required" });
    }

    const total = cart.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + (item.price * item.quantity);
    }, 0);

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

    if (!orderID) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const ordersController = new OrdersController(client);

    const response = await ordersController.captureOrder({
      id: orderID,
      prefer: "return=minimal",
    });

    return res.json(response.result);
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    return res.status(500).json({ error: "Failed to capture PayPal order" });
  }
}
