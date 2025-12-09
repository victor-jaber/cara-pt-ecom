import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Plus, 
  Search, 
  Truck, 
  Pencil,
  Trash2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ShippingOption } from "@shared/schema";
import { insertShippingOptionSchema } from "@shared/schema";

const shippingFormSchema = insertShippingOptionSchema.extend({
  price: z.string().min(1, "Preço obrigatório"),
  sortOrder: z.union([z.number(), z.string()]).optional().transform(val => 
    val === "" || val === undefined ? 0 : typeof val === "string" ? parseInt(val, 10) : val
  ),
});

type ShippingFormData = z.infer<typeof shippingFormSchema>;

export default function AdminShipping() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<ShippingOption | null>(null);

  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      estimatedDays: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  const { data: shippingOptions = [], isLoading } = useQuery<ShippingOption[]>({
    queryKey: ["/api/admin/shipping-options"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ShippingFormData) => {
      const res = await apiRequest("POST", "/api/admin/shipping-options", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-options"] });
      toast({ title: "Opção Criada", description: "A opção de envio foi criada com sucesso." });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar a opção de envio.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ShippingFormData }) => {
      const res = await apiRequest("PATCH", `/api/admin/shipping-options/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-options"] });
      toast({ title: "Opção Atualizada", description: "A opção de envio foi atualizada com sucesso." });
      setDialogOpen(false);
      setEditingOption(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar a opção de envio.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/shipping-options/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-options"] });
      toast({ title: "Opção Eliminada", description: "A opção de envio foi eliminada com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível eliminar a opção de envio.", variant: "destructive" });
    },
  });

  const openEditDialog = (option: ShippingOption) => {
    setEditingOption(option);
    form.reset({
      name: option.name,
      description: option.description || "",
      price: option.price,
      estimatedDays: option.estimatedDays || "",
      isActive: option.isActive,
      sortOrder: option.sortOrder || 0,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingOption(null);
    form.reset({
      name: "",
      description: "",
      price: "",
      estimatedDays: "",
      isActive: true,
      sortOrder: 0,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: ShippingFormData) => {
    if (editingOption) {
      updateMutation.mutate({ id: editingOption.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredOptions = shippingOptions.filter((option) =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-12 bg-muted animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-shipping-title">
            Opções de Envio
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurar opções de frete para o checkout
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-add-shipping">
          <Plus className="h-4 w-4 mr-2" />
          Nova Opção
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar opções de envio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-shipping"
        />
      </div>

      {filteredOptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Nenhuma opção de envio encontrada</h3>
            <p className="text-muted-foreground mt-1">
              {search ? "Tente ajustar a pesquisa" : "Comece por adicionar uma opção de envio"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOptions.map((option) => (
            <Card key={option.id} data-testid={`shipping-card-${option.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Truck className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{option.name}</h3>
                      <Badge variant={option.isActive ? "default" : "secondary"}>
                        {option.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {option.description}
                    </p>
                    <div className="flex gap-4 mt-1">
                      <span className="font-medium">
                        {parseFloat(option.price) === 0 ? "Grátis" : `€${parseFloat(option.price).toFixed(2)}`}
                      </span>
                      {option.estimatedDays && (
                        <span className="text-sm text-muted-foreground">
                          {option.estimatedDays}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(option)}
                      data-testid={`button-edit-${option.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(option.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${option.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingOption ? "Editar Opção de Envio" : "Nova Opção de Envio"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Envio Expresso" data-testid="input-shipping-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Ex: Entrega em 24-48 horas úteis"
                        rows={3}
                        data-testid="input-shipping-description" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (EUR)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text" 
                          placeholder="0.00"
                          data-testid="input-shipping-price" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo Estimado</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""} 
                          placeholder="Ex: 2-3 dias úteis"
                          data-testid="input-shipping-days" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de Exibição</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value, 10))}
                          data-testid="input-shipping-order" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 pt-8">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-shipping-active"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Ativo</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-shipping"
                >
                  {editingOption ? "Guardar Alterações" : "Criar Opção"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
