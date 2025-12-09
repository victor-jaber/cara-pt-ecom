import { useQuery, useMutation } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/loading-skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, Filter, X } from "lucide-react";
import type { Product } from "@shared/schema";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Products() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

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
        title: "Produto adicionado",
        description: "O produto foi adicionado ao carrinho.",
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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    
    const productType = product.name.toLowerCase();
    return matchesSearch && productType.includes(filter.toLowerCase());
  });

  const productTypes = ["soft", "mild", "hard", "ultra"];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Catálogo de Produtos</h1>
        <p className="text-muted-foreground mt-1">
          Explore a nossa linha completa de Ácido Hialurónico CARA.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-products"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Produtos</SelectItem>
            {productTypes.map((type) => (
              <SelectItem key={type} value={type}>
                CARA {type.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {(search || filter !== "all") && (
        <div className="flex flex-wrap gap-2 mb-6">
          {search && (
            <Badge variant="secondary" className="gap-1">
              Pesquisa: {search}
              <button onClick={() => setSearch("")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Tipo: {filter.toUpperCase()}
              <button onClick={() => setFilter("all")} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Limpar filtros
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
              {products.length === 0 ? "Nenhum produto disponível" : "Nenhum produto encontrado"}
            </h3>
            <p className="text-muted-foreground mt-1">
              {products.length === 0
                ? "Os produtos serão adicionados em breve."
                : "Tente ajustar os filtros de pesquisa."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(p) => addToCartMutation.mutate(p.id)}
                isLoading={addToCartMutation.isPending}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
