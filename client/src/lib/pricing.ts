import type { PromotionRule } from "@shared/schema";

export function calculateItemPrice(
  quantity: number,
  basePrice: string | number,
  promotionRules?: PromotionRule[] | null
): number {
  const basePriceNum = typeof basePrice === "string" ? parseFloat(basePrice) : basePrice;
  
  if (!promotionRules || promotionRules.length === 0) {
    return basePriceNum * quantity;
  }
  
  const sortedRules = [...promotionRules].sort((a, b) => b.minQuantity - a.minQuantity);
  
  for (const rule of sortedRules) {
    if (quantity >= rule.minQuantity) {
      return parseFloat(rule.pricePerUnit) * quantity;
    }
  }
  
  return basePriceNum * quantity;
}

export function getApplicablePromotionRule(
  quantity: number,
  promotionRules?: PromotionRule[] | null
): PromotionRule | null {
  if (!promotionRules || promotionRules.length === 0) {
    return null;
  }
  
  const sortedRules = [...promotionRules].sort((a, b) => b.minQuantity - a.minQuantity);
  
  for (const rule of sortedRules) {
    if (quantity >= rule.minQuantity) {
      return rule;
    }
  }
  
  return null;
}

export function getUnitPrice(
  quantity: number,
  basePrice: string | number,
  promotionRules?: PromotionRule[] | null
): number {
  const basePriceNum = typeof basePrice === "string" ? parseFloat(basePrice) : basePrice;
  const applicableRule = getApplicablePromotionRule(quantity, promotionRules);
  
  if (applicableRule) {
    return parseFloat(applicableRule.pricePerUnit);
  }
  
  return basePriceNum;
}
