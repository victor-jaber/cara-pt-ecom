import { useQuery, useMutation } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/loading-skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, X } from "lucide-react";
import type { Product } from "@shared/schema";
import { useState, useMemo } from "react";
import { useLocationContext } from "@/contexts/LocationContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useLanguage } from "@/contexts/LanguageContext";

const PRODUCT_CATEGORIES = [
  { value: "all", label: "shop.filters.all" },
  { value: "soft", label: "shop.filters.soft" },
  { value: "mild", label: "shop.filters.mild" },
  { value: "hard", label: "shop.filters.hard" },
  { value: "ultra", label: "shop.filters.ultra" },
] as const;

export default function Products() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { isInternational } = useLocationContext();
  const { isAuthenticated } = useAuth();
  const guestCart = useGuestCart();

  const shouldUseGuestCart = isInternational;

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/cart", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: t("cart.added"),
        description: t("cart.addedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("cart.error"),
        description: t("cart.errorDesc"),
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (product: Product) => {
    if (shouldUseGuestCart) {
      guestCart.addItem(product);
      toast({
        title: t("cart.added"),
        description: t("cart.addedDesc"),
      });
    } else {
      addToCartMutation.mutate(product.id);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchLower = searchText.toLowerCase().trim();
      const nameLower = product.name.toLowerCase();
      const descLower = (product.description || "").toLowerCase();

      const matchesSearch = searchLower === "" ||
        nameLower.includes(searchLower) ||
        descLower.includes(searchLower);

      if (selectedCategory === "all") {
        return matchesSearch;
      }

      // Use the category field directly
      const matchesCategory = product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchText, selectedCategory]);

  const clearFilters = () => {
    setSearchText("");
    setSelectedCategory("all");
  };

  const hasActiveFilters = searchText !== "" || selectedCategory !== "all";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("shop.catalog.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("shop.catalog.subtitle")}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Search Input */}
        <div className="flex gap-2 items-center max-w-md">
          <Input
            type="text"
            placeholder={t("shop.search.placeholder")}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1"
            data-testid="input-search-products"
          />
          {searchText && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchText("")}
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {PRODUCT_CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              data-testid={`filter-${cat.value}`}
            >
              {t(cat.label)}
            </Button>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {searchText && (
            <Badge variant="secondary" className="gap-1">
              {t("shop.filters.search")} {searchText}
              <button
                onClick={() => setSearchText("")}
                className="ml-1 hover:text-destructive"
                data-testid="badge-clear-search"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {t("shop.filters.category")} {t(PRODUCT_CATEGORIES.find(c => c.value === selectedCategory)?.label || "")}
              <button
                onClick={() => setSelectedCategory("all")}
                className="ml-1 hover:text-destructive"
                data-testid="badge-clear-category"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            data-testid="button-clear-all-filters"
          >
            {t("shop.filters.clear")}
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">
              {products.length === 0 ? t("shop.empty.available") : t("shop.empty.found")}
            </h3>
            <p className="text-muted-foreground mt-1">
              {products.length === 0
                ? t("shop.empty.availableDesc")
                : t("shop.empty.foundDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredProducts.length} {t("shop.count")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
                isLoading={addToCartMutation.isPending}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
