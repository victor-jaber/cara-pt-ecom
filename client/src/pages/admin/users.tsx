import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, UserPlus, Users as UsersIcon, Mail } from "lucide-react";

function getErrorMessage(error: any, fallback: string) {
  const raw = error?.message;
  if (typeof raw === "string") {
    const idx = raw.indexOf(":");
    const maybeJson = idx >= 0 ? raw.slice(idx + 1).trim() : raw;
    try {
      const parsed = JSON.parse(maybeJson);
      if (parsed?.message) return parsed.message as string;
    } catch {
      // ignore
    }
    return raw;
  }
  return fallback;
}

export default function AdminUsers() {
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const admins = useMemo(() => users.filter((u) => u.role === "admin"), [users]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentAdminPassword, setCurrentAdminPassword] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/users", {
        firstName,
        lastName,
        email,
        password,
        currentAdminPassword,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Administrador criado",
        description: "O novo administrador já pode iniciar sessão.",
      });
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setCurrentAdminPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: getErrorMessage(error, "Não foi possível criar o administrador."),
        variant: "destructive",
      });
    },
  });

  const canSubmit = firstName && lastName && email && password && currentAdminPassword;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-admin-users-title">
          Usuários
        </h1>
        <p className="text-muted-foreground mt-1">Criar e gerir administradores</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Administrador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-first-name">Nome</Label>
              <Input
                id="admin-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-admin-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-last-name">Apelido</Label>
              <Input
                id="admin-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-testid="input-admin-last-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemplo.com"
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha inicial</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="input-admin-password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-current-password">Confirme com sua senha de admin</Label>
            <Input
              id="admin-current-password"
              type="password"
              value={currentAdminPassword}
              onChange={(e) => setCurrentAdminPassword(e.target.value)}
              placeholder="••••••••"
              data-testid="input-admin-current-password"
            />
            <p className="text-xs text-muted-foreground">
              Isto impede que alguém logado crie administradores sem autorização.
            </p>
          </div>

          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
            data-testid="button-create-admin"
          >
            <Shield className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "A criar..." : "Criar administrador"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Administradores ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-12 bg-muted animate-pulse rounded" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum administrador encontrado.</div>
          ) : (
            admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-4"
                data-testid={`admin-row-${admin.id}`}
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {admin.firstName} {admin.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{admin.email}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Admin</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
