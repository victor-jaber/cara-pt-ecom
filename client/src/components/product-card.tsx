import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ShoppingCart, Lock } from "lucide-react";
import type { Product } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useLocationContext } from "@/contexts/LocationContext";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  isLoading?: boolean;
  showPrices?: boolean;
}

export function ProductCard({ product, onAddToCart, isLoading, showPrices = true }: ProductCardProps) {
  const { isApproved } = useAuth();
  const { isInternational } = useLocationContext();
  
  const canSeePrices = showPrices && (isInternational || isApproved);
  const canAddToCart = canSeePrices && product.inStock;

  const productColors: Record<string, string> = {
    soft: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    mild: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    hard: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    ultra: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };

  const getProductType = () => {
    const name = product.name.toLowerCase();
    if (name.includes("soft")) return "soft";
    if (name.includes("mild")) return "mild";
    if (name.includes("hard")) return "hard";
    if (name.includes("ultra")) return "ultra";
    return "soft";
  };

  const colorClass = productColors[getProductType()];

  return (
    <Card className="group overflow-visible hover-elevate" data-testid={`card-product-${product.id}`}>
      <CardContent className="p-0">
        <div className="aspect-square relative overflow-hidden rounded-t-md bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-4xl font-bold text-muted-foreground/30">CARA</div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary">Esgotado</Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge className={colorClass}>
                {getProductType().toUpperCase()}
              </Badge>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
            {product.shortDescription && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {product.shortDescription}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {product.particleSize && (
              <span className="flex items-center gap-1">
                <span className="font-medium">Partícula:</span> {product.particleSize}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {canSeePrices ? (
              <span className="text-xl font-bold" data-testid={`text-price-${product.id}`}>
                {Number(product.price).toLocaleString("pt-PT", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Login to see price</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link href={`/produto/${product.slug}`} className="flex-1">
              <Button variant="outline" className="w-full" data-testid={`button-view-${product.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </Button>
            </Link>
            {canAddToCart && onAddToCart && (
              <Button
                size="icon"
                onClick={() => onAddToCart(product)}
                disabled={isLoading}
                data-testid={`button-add-cart-${product.id}`}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
