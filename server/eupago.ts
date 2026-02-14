import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { findShippingOptionOrNull, getHardcodedShippingOptions } from "./shipping";

type EupagoMode = "sandbox" | "live";

function toEnvUrl(url: string, mode: EupagoMode): string {
  if (mode === "live") return url.replace("https://sandbox.eupago.pt", "https://clientes.eupago.pt");
  return url;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function extractFirst(obj: any, keys: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    const v = (obj as any)[key];
    const s = asString(v);
    if (s && s.trim()) return s;
  }
  return undefined;
}

function extractEupagoRefs(payload: any): { entity?: string; reference?: string; transactionId?: string } {
  const entity =
    extractFirst(payload, ["entidade", "entity"]) ||
    extractFirst(payload?.transactions, ["entity"]) ||
    extractFirst(payload?.transaction, ["entity"]);

  const reference =
    extractFirst(payload, ["referencia", "reference", "ref"]) ||
    extractFirst(payload?.transactions, ["reference"]) ||
    extractFirst(payload?.transaction, ["reference"]);

  const transactionId =
    extractFirst(payload, ["transacao", "transaction", "trid", "transactionId"]) ||
    extractFirst(payload?.transactions, ["trid"]) ||
    extractFirst(payload?.transaction, ["trid"]);

  return { entity, reference, transactionId };
}

function eupagoWasSuccessful(data: any): boolean {
  if (!data || typeof data !== "object") return true;
  const anyData = data as any;
  if (typeof anyData.sucesso === "boolean") return anyData.sucesso;
  if (typeof anyData.success === "boolean") return anyData.success;
  if (typeof anyData.estado === "number") return anyData.estado >= 0;
  if (typeof anyData.status === "number") return anyData.status >= 0;
  return true;
}

function extractEupagoErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") return data.trim() || fallback;
  if (typeof data !== "object") return fallback;

  const anyData = data as any;
  const resposta = asString(anyData.resposta) || asString(anyData.message) || asString(anyData.error);
  if (resposta && resposta.trim()) return resposta.trim();
  return fallback;
}

async function eupagoPostJson(options: {
  url: string;
  apiKey: string;
  mode: EupagoMode;
  body: any;
  useApiKeyHeader: boolean;
}): Promise<{ status: number; data: any; rawText: string }>
{
  const url = toEnvUrl(options.url, options.mode);
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  if (options.useApiKeyHeader) {
    // EuPago APIs are inconsistent across endpoints/versions; send the API key
    // using a few common header conventions for maximum compatibility.
    headers["ApiKey"] = options.apiKey;
    headers["apikey"] = options.apiKey;
    headers["X-API-KEY"] = options.apiKey;
    headers["Authorization"] = `ApiKey ${options.apiKey}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(options.body ?? {}),
  });

  const rawText = await response.text();
  let data: any = rawText;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    // keep rawText
  }

  return { status: response.status, data, rawText };
}

type CartSnapshotItem = { productId: string; quantity: number; price: string; name: string };

async function snapshotCartOrItems(options: {
  userId: string;
  items?: Array<{ productId: string; quantity: number }>;
}): Promise<{ cartSnapshot: CartSnapshotItem[]; subtotal: number; source: "server_cart" | "client_items" }>
{
  const cartSnapshot: CartSnapshotItem[] = [];
  let subtotal = 0;

  if (Array.isArray(options.items) && options.items.length > 0) {
    for (const item of options.items) {
      const product = await storage.getProductById(item.productId);
      if (!product) {
        throw new Error("Product not found");
      }
      if (!product.inStock) {
        throw new Error(`Product ${product.name} is out of stock`);
      }
      const quantity = Number(item.quantity) || 0;
      if (quantity <= 0) {
        throw new Error("Invalid quantity");
      }
      subtotal += parseFloat(product.price) * quantity;
      cartSnapshot.push({ productId: product.id, quantity, price: product.price, name: product.name });
    }
    return { cartSnapshot, subtotal, source: "client_items" };
  }

  const cartItems = await storage.getCartItems(options.userId);
  if (cartItems.length === 0) {
    throw new Error("Cart is empty");
  }
  for (const item of cartItems) {
    const product = await storage.getProductById(item.productId);
    if (!product) {
      throw new Error(`Product ${item.product.name} is no longer available`);
    }
    if (!product.inStock) {
      throw new Error(`Product ${product.name} is out of stock`);
    }
    subtotal += parseFloat(product.price) * item.quantity;
    cartSnapshot.push({ productId: product.id, quantity: item.quantity, price: product.price, name: product.name });
  }
  return { cartSnapshot, subtotal, source: "server_cart" };
}

export async function createEupagoMultibancoOrder(req: Request, res: Response) {
  try {
    const settings = await storage.getEupagoSettings();
    const apiKey = (settings?.apiKey || "").trim();
    if (!settings || !settings.isEnabled || !apiKey || apiKey === "********") {
      return res.status(400).json({ message: "EuPago is not configured or enabled" });
    }

    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { shippingOptionId, countryCode, region, shippingAddress = "", notes = "", items } = (req.body || {}) as any;
    const cc = (countryCode || "").toUpperCase();
    if (cc !== "PT" && cc !== "BR") {
      return res.status(400).json({ message: "EuPago is only available for Portugal and Brazil" });
    }

    const { cartSnapshot, subtotal, source } = await snapshotCartOrItems({ userId: user.id, items });

    const availableShippingOptions = getHardcodedShippingOptions({ countryCode, region, subtotal });
    if (availableShippingOptions.length > 0 && !shippingOptionId) {
      return res.status(400).json({ message: "Shipping option is required" });
    }
    const selectedShipping = findShippingOptionOrNull(availableShippingOptions, shippingOptionId);
    if (shippingOptionId && !selectedShipping) {
      return res.status(400).json({ message: "Invalid shipping option for your location" });
    }

    const shippingCost = selectedShipping ? parseFloat(selectedShipping.price) : 0;
    const shippingOptionName = selectedShipping ? selectedShipping.name : undefined;

    const total = subtotal + shippingCost;
    const identifier = randomUUID();

    const eupagoBody = {
      chave: apiKey,
      valor: Number(total.toFixed(2)),
      id: identifier,
      per_dup: 0,
    };

    const eupagoResponse = await eupagoPostJson({
      url: "https://sandbox.eupago.pt/clientes/rest_api/multibanco/create",
      apiKey,
      mode: settings.mode,
      body: eupagoBody,
      useApiKeyHeader: true,
    });

    if (eupagoResponse.status < 200 || eupagoResponse.status >= 300) {
      console.error("EuPago Multibanco create failed:", eupagoResponse.status, eupagoResponse.rawText);
      return res.status(502).json({ message: "Failed to create Multibanco reference" });
    }

    if (!eupagoWasSuccessful(eupagoResponse.data)) {
      const msg = extractEupagoErrorMessage(eupagoResponse.data, "EuPago rejected the request");
      console.error("EuPago Multibanco create rejected:", eupagoResponse.status, eupagoResponse.rawText);
      return res.status(502).json({ message: msg });
    }

    const refs = extractEupagoRefs(eupagoResponse.data);

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
        paymentMethod: "eupago_multibanco",
        paymentStatus: "pending",
        shippingOptionId: selectedShipping ? selectedShipping.id : null,
        shippingCost: shippingCost.toFixed(2),
        shippingOptionName: shippingOptionName || null,
        paymentMetadata: {
          eupago: {
            method: "multibanco",
            identifier,
            entity: refs.entity,
            reference: refs.reference,
            transactionId: refs.transactionId,
            raw: eupagoResponse.data,
          },
        },
      } as any,
      orderItems,
    );

    if (source === "server_cart") {
      await storage.clearCart(user.id);
    }

    return res.json({
      success: true,
      orderId: order.id,
      total: total.toFixed(2),
      entity: refs.entity,
      reference: refs.reference,
      identifier,
      raw: eupagoResponse.data,
    });
  } catch (error: any) {
    console.error("Error creating EuPago Multibanco order:", error);
    const msg = String(error?.message || "");
    if (msg === "Cart is empty") {
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: msg || "Failed to create Multibanco order" });
  }
}

export async function createEupagoMbwayOrder(req: Request, res: Response) {
  try {
    const settings = await storage.getEupagoSettings();
    const apiKey = (settings?.apiKey || "").trim();
    if (!settings || !settings.isEnabled || !apiKey || apiKey === "********") {
      return res.status(400).json({ message: "EuPago is not configured or enabled" });
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
      phone,
    } = (req.body || {}) as any;

    const cc = (countryCode || "").toUpperCase();
    if (cc !== "PT" && cc !== "BR") {
      return res.status(400).json({ message: "EuPago is only available for Portugal and Brazil" });
    }

    const phoneStr = typeof phone === "string" ? phone.trim() : "";
    if (!phoneStr) {
      return res.status(400).json({ message: "Phone number is required for MBWay" });
    }

    const phoneDigits = phoneStr.replace(/\D+/g, "");
    const phoneNormalized =
      phoneDigits.length === 12 && phoneDigits.startsWith("351") ? phoneDigits.slice(3) : phoneDigits;

    const { cartSnapshot, subtotal, source } = await snapshotCartOrItems({ userId: user.id, items });

    const availableShippingOptions = getHardcodedShippingOptions({ countryCode, region, subtotal });
    if (availableShippingOptions.length > 0 && !shippingOptionId) {
      return res.status(400).json({ message: "Shipping option is required" });
    }
    const selectedShipping = findShippingOptionOrNull(availableShippingOptions, shippingOptionId);
    if (shippingOptionId && !selectedShipping) {
      return res.status(400).json({ message: "Invalid shipping option for your location" });
    }

    const shippingCost = selectedShipping ? parseFloat(selectedShipping.price) : 0;
    const shippingOptionName = selectedShipping ? selectedShipping.name : undefined;
    const total = subtotal + shippingCost;

    const identifier = randomUUID();

    // EuPago MB WAY has multiple API variants in the wild. We'll attempt one, and
    // if the gateway complains about missing auth/phone, fall back to the REST API variant.
    const v102Body = {
      chave: apiKey,
      customerPhone: phoneNormalized,
      CustomerPhone: phoneNormalized,
      phone: phoneNormalized,
      telemovel: phoneNormalized,
      telefone: phoneNormalized,
      customerEmail: user.email,
      email: user.email,
      payment: {
        identifier,
        title: `Pedido ${identifier}`,
        amount: {
          value: Number(total.toFixed(2)),
          currency: "EUR",
        },
      },
      customer: {
        phone: phoneNormalized,
        email: user.email,
      },
    };

    const restApiBody = {
      chave: apiKey,
      // REST API endpoints commonly accept/expect flat params.
      valor: Number(total.toFixed(2)),
      id: identifier,
      // Common fields used by EuPago REST API docs/examples
      telemovel: phoneNormalized,
      telefone: phoneNormalized,
      email: user.email,
      nome: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      descricao: `Pedido ${identifier}`,
      // Some endpoints use these alternative names
      customer: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      customer_name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      customer_email: user.email,
    };

    const v102Url = "https://sandbox.eupago.pt/api/v1.02/mbway/create";
    const restApiUrl = "https://sandbox.eupago.pt/clientes/rest_api/mbway/create";

    const primary = settings.mode === "live" ? "rest" : "v102";
    const firstAttempt = primary === "rest"
      ? await eupagoPostJson({ url: restApiUrl, apiKey, mode: settings.mode, body: restApiBody, useApiKeyHeader: true })
      : await eupagoPostJson({ url: v102Url, apiKey, mode: settings.mode, body: v102Body, useApiKeyHeader: true });

    const firstCode = asString((firstAttempt.data as any)?.code) || "";
    const firstMessage = extractEupagoErrorMessage(firstAttempt.data, "");
    const firstSuccessful =
      firstAttempt.status >= 200 && firstAttempt.status < 300 && eupagoWasSuccessful(firstAttempt.data);
    const missingRequiredParams = /Faltam\s+par[âa]metros\s+obrigat[óo]rios/i.test(firstMessage);

    const shouldFallback =
      !firstSuccessful &&
      (
        missingRequiredParams ||
        (firstAttempt.status === 401 && firstCode === "APIKEY_MISSING") ||
        (firstAttempt.status === 400 && firstCode === "CUSTOMERPHONE_MISSING")
      );

    const eupagoResponse = shouldFallback
      ? (primary === "rest"
          ? await eupagoPostJson({ url: v102Url, apiKey, mode: settings.mode, body: v102Body, useApiKeyHeader: true })
          : await eupagoPostJson({ url: restApiUrl, apiKey, mode: settings.mode, body: restApiBody, useApiKeyHeader: true }))
      : firstAttempt;

    if (eupagoResponse.status < 200 || eupagoResponse.status >= 300) {
      console.error("EuPago MBWay create failed:", eupagoResponse.status, eupagoResponse.rawText);
      const code = asString((eupagoResponse.data as any)?.code) || "";
      if (eupagoResponse.status === 400 && code === "CUSTOMERPHONE_MISSING") {
        return res.status(400).json({ message: "Telefone MB WAY é obrigatório" });
      }
      return res.status(502).json({ message: "Failed to create MBWay request" });
    }

    if (!eupagoWasSuccessful(eupagoResponse.data)) {
      const msg = extractEupagoErrorMessage(eupagoResponse.data, "EuPago rejected the request");
      console.error("EuPago MBWay create rejected:", eupagoResponse.status, eupagoResponse.rawText);
      const code = asString((eupagoResponse.data as any)?.code) || "";
      if (code === "CUSTOMERPHONE_MISSING") {
        return res.status(400).json({ message: "Telefone MB WAY é obrigatório" });
      }
      return res.status(502).json({ message: msg });
    }

    const refs = extractEupagoRefs(eupagoResponse.data);

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
        paymentMethod: "eupago_mbway",
        paymentStatus: "pending",
        shippingOptionId: selectedShipping ? selectedShipping.id : null,
        shippingCost: shippingCost.toFixed(2),
        shippingOptionName: shippingOptionName || null,
        paymentMetadata: {
          eupago: {
            method: "mbway",
            identifier,
            phone: phoneStr,
            entity: refs.entity,
            reference: refs.reference,
            transactionId: refs.transactionId,
            raw: eupagoResponse.data,
          },
        },
      } as any,
      orderItems,
    );

    if (source === "server_cart") {
      await storage.clearCart(user.id);
    }

    return res.json({
      success: true,
      orderId: order.id,
      total: total.toFixed(2),
      transactionId: refs.transactionId,
      identifier,
      raw: eupagoResponse.data,
    });
  } catch (error: any) {
    console.error("Error creating EuPago MBWay order:", error);
    const msg = String(error?.message || "");
    if (msg === "Cart is empty") {
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: msg || "Failed to create MBWay order" });
  }
}

function getParam(req: Request, key: string): string | undefined {
  const q = (req.query as any)?.[key];
  if (typeof q === "string") return q;
  const b = (req.body as any)?.[key];
  if (typeof b === "string") return b;
  if (typeof b === "number") return String(b);
  return undefined;
}

export async function handleEupagoWebhook(req: Request, res: Response) {
  try {
    const settings = await storage.getEupagoSettings();
    const apiKey = typeof settings?.apiKey === "string" ? settings.apiKey.trim() : "";

    // Webhook V1.0 sends query params.
    const chaveApi = getParam(req, "chave_api") || getParam(req, "chave");
    const referencia = getParam(req, "referencia");
    const entidade = getParam(req, "entidade");
    const transacao = getParam(req, "transacao") || getParam(req, "trid");
    const identificador = getParam(req, "identificador") || getParam(req, "id");
    const mp = getParam(req, "mp");
    const valor = getParam(req, "valor");
    const data = getParam(req, "data");

    const chaveApiTrim = typeof chaveApi === "string" ? chaveApi.trim() : "";
    if (!apiKey || !chaveApiTrim || chaveApiTrim !== apiKey) {
      console.warn("EuPago webhook received with invalid api key");
      return res.status(200).send("OK");
    }

    let order = undefined as any;
    if (referencia) {
      order = await storage.findOrderByEupagoReference(referencia, entidade);
    }
    if (!order && transacao) {
      order = await storage.findOrderByEupagoTransactionId(transacao);
    }
    if (!order && identificador) {
      order = await storage.findOrderByEupagoIdentifier(identificador);
    }

    if (!order) {
      console.warn("EuPago webhook: order not found", { referencia, entidade, transacao, identificador });
      return res.status(200).send("OK");
    }

    if (order.paymentStatus === "completed") {
      return res.status(200).send("OK");
    }

    const existingMetadata = (order.paymentMetadata as any) || {};
    const mergedMetadata = {
      ...existingMetadata,
      eupago: {
        ...(existingMetadata.eupago || {}),
        webhookV1: {
          referencia,
          entidade,
          transacao,
          identificador,
          mp,
          valor,
          data,
        },
      },
    };

    await storage.updateOrderPayment(order.id, {
      paymentStatus: "completed",
      status: "confirmed",
      paymentMetadata: mergedMetadata,
    } as any);

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling EuPago webhook:", error);
    return res.status(200).send("OK");
  }
}
