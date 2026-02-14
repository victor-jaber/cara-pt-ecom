import type { ShippingOption } from "@shared/schema";

type ShippingGeo = {
  countryCode?: string | null;
  region?: string | null;
};

type ShippingContext = ShippingGeo & {
  subtotal: number;
};

const EU_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isPortugalIslands(region?: string | null): boolean {
  if (!region) return false;
  const normalized = normalizeText(region);
  return normalized.includes("madeira") || normalized.includes("acores") || normalized.includes("azores");
}

function isPortugalMainland(countryCode?: string | null, region?: string | null): boolean {
  if ((countryCode || "").toUpperCase() !== "PT") return false;
  return !isPortugalIslands(region);
}

function isEuropeanUnionNonPortugal(countryCode?: string | null): boolean {
  const code = (countryCode || "").toUpperCase();
  return code !== "PT" && EU_COUNTRIES.has(code);
}

function buildOption(partial: {
  id: string;
  name: string;
  description: string;
  price: string;
  estimatedDays: string;
  sortOrder: number;
}): ShippingOption {
  const now = new Date();
  return {
    id: partial.id,
    name: partial.name,
    description: partial.description,
    price: partial.price,
    estimatedDays: partial.estimatedDays,
    isActive: true,
    sortOrder: partial.sortOrder,
    createdAt: now,
    updatedAt: now,
  } as ShippingOption;
}

export function getHardcodedShippingOptions(ctx: ShippingContext): ShippingOption[] {
  const { countryCode, region, subtotal } = ctx;

  const cc = (countryCode || "").toUpperCase();

  // Brazil/Portugal: always free shipping (no minimum)
  if (cc === "BR" || cc === "PT") {
    return [
      buildOption({
        id: "free-shipping",
        name: "Envio Grátis",
        description: cc === "BR" ? "Disponível para entregas no Brasil" : "Disponível para entregas em Portugal",
        price: "0.00",
        estimatedDays: "",
        sortOrder: -10,
      }),
    ];
  }

  const options: ShippingOption[] = [];

  // 1) Free shipping for all above €500
  if (subtotal >= 500) {
    options.push(
      buildOption({
        id: "free-shipping",
        name: "Envio Grátis",
        description: "Disponível apenas para pedidos acima de €500",
        price: "0.00",
        estimatedDays: "",
        sortOrder: -10,
      }),
    );
  }

  // 2) Portugal Mainland
  if (isPortugalMainland(countryCode, region)) {
    options.push(
      buildOption({
        id: "pt-standard",
        name: "Envio Standard",
        description: "Apenas Portugal Continental",
        price: "7.00",
        estimatedDays: "Entrega 1 a 2 dias",
        sortOrder: 0,
      }),
    );
  }

  // 3) Portugal Islands
  if (cc === "PT" && isPortugalIslands(region)) {
    options.push(
      buildOption({
        id: "pt-islands",
        name: "Envio Ilhas",
        description: "Apenas Açores e Madeira",
        price: "16.00",
        estimatedDays: "Entrega 2-5 dias úteis",
        sortOrder: 1,
      }),
    );
  }

  // 4/5) EU (non-Portugal)
  if (isEuropeanUnionNonPortugal(countryCode)) {
    options.push(
      buildOption({
        id: "dhl-eu-ground",
        name: "DHL UE - Via Terrestre",
        description: "Disponível apenas para países da União Europeia",
        price: "19.00",
        estimatedDays: "Entrega 3-5 dias úteis",
        sortOrder: 2,
      }),
      buildOption({
        id: "dhl-eu-air",
        name: "DHL UE - Via Aérea",
        description: "Disponível apenas para países da União Europeia",
        price: "25.00",
        estimatedDays: "Entrega 1-2 dias úteis",
        sortOrder: 3,
      }),
    );
  }

  return options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function findShippingOptionOrNull(
  options: ShippingOption[],
  shippingOptionId?: string | null,
): ShippingOption | null {
  if (!shippingOptionId) return null;
  return options.find((opt) => opt.id === shippingOptionId) || null;
}
