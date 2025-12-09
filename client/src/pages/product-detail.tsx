import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateItemPrice, getApplicablePromotionRule } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Minus, Plus, ArrowLeft, CheckCircle2, Package, Tag } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:slug");
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", params?.slug],
    enabled: !!params?.slug,
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", { productId: product?.id, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Produto adicionado",
        description: `${quantity}x ${product?.name} adicionado ao carrinho.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao carrinho.",
        variant: "destructive",
      });
    },
  });

  const productColors: Record<string, string> = {
    soft: "bg-sky-500",
    mild: "bg-emerald-500",
    hard: "bg-amber-500",
    ultra: "bg-purple-500",
  };

  const getProductType = () => {
    const name = product?.name?.toLowerCase() || "";
    if (name.includes("soft")) return "soft";
    if (name.includes("mild")) return "mild";
    if (name.includes("hard")) return "hard";
    if (name.includes("ultra")) return "ultra";
    return "soft";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Produto não encontrado</h3>
            <p className="text-muted-foreground mt-1">O produto que procura não existe ou foi removido.</p>
            <Link href="/produtos">
              <Button className="mt-4">Ver Catálogo</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/produtos">
        <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar aos Produtos
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="aspect-square rounded-lg bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain p-8"
            />
          ) : (
            <div className={`w-32 h-32 rounded-full ${productColors[getProductType()]} flex items-center justify-center`}>
              <span className="text-white font-bold text-2xl">CARA</span>
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">Esgotado</Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge className={`${productColors[getProductType()]} text-white mb-3`}>
              {getProductType().toUpperCase()}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
            {product.infodmCode && (
              <p className="text-sm text-muted-foreground mt-2">
                CDM INFARMED: {product.infodmCode}
              </p>
            )}
          </div>

          {(() => {
            const applicableRule = getApplicablePromotionRule(quantity, product.promotionRules);
            const totalPrice = calculateItemPrice(quantity, product.price, product.promotionRules);
            const originalTotal = Number(product.price) * quantity;
            const hasDiscount = applicableRule !== null;
            
            return (
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  {hasDiscount ? (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        {originalTotal.toLocaleString("pt-PT", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </span>
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {totalPrice.toLocaleString("pt-PT", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        Desconto Quantidade
                      </Badge>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-foreground">
                      {totalPrice.toLocaleString("pt-PT", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  )}
                </div>
                {quantity > 1 && (
                  <p className="text-sm text-muted-foreground">
                    {(totalPrice / quantity).toLocaleString("pt-PT", {
                      style: "currency",
                      currency: "EUR",
                    })} / unidade
                  </p>
                )}
              </div>
            );
          })()}

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          {product.promotionRules && product.promotionRules.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Descontos por Quantidade
                </h3>
                <div className="space-y-2">
                  {[...product.promotionRules]
                    .sort((a, b) => a.minQuantity - b.minQuantity)
                    .map((rule, index) => {
                      const isActive = getApplicablePromotionRule(quantity, product.promotionRules)?.minQuantity === rule.minQuantity;
                      return (
                        <div
                          key={index}
                          className={`flex justify-between items-center text-sm p-2 rounded-md ${
                            isActive
                              ? "bg-emerald-500/10 border border-emerald-500/30"
                              : "bg-muted/50"
                          }`}
                        >
                          <span className={isActive ? "font-medium" : ""}>
                            A partir de {rule.minQuantity} unidades
                          </span>
                          <span className={`font-medium ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                            {Number(rule.pricePerUnit).toLocaleString("pt-PT", {
                              style: "currency",
                              currency: "EUR",
                            })} / unidade
                          </span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Specs */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Especificações Técnicas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {product.particleSize && (
                  <div>
                    <span className="text-muted-foreground">Tamanho da Partícula</span>
                    <p className="font-medium">{product.particleSize}</p>
                  </div>
                )}
                {product.needleSize && (
                  <div>
                    <span className="text-muted-foreground">Tamanho da Agulha</span>
                    <p className="font-medium">{product.needleSize}</p>
                  </div>
                )}
                {product.injectionDepth && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Profundidade de Injeção</span>
                    <p className="font-medium">{product.injectionDepth}</p>
                  </div>
                )}
                {product.applicationZones && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Zonas de Aplicação</span>
                    <p className="font-medium">{product.applicationZones}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>3% Lidocaína para maior conforto</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>24mg/ml de Ácido Hialurónico</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Agulha Super Fina (Thin Wall)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Tecnologia Hy-Brid Cruelty Free</span>
            </div>
          </div>

          {/* Add to Cart */}
          {product.inStock && (
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="button-decrease-quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center"
                  data-testid="input-quantity"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  data-testid="button-increase-quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Adicionar ao Carrinho
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
