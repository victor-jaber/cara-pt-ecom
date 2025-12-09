import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Check, 
  X, 
  Mail, 
  Phone, 
  Building2, 
  FileText,
  Clock
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminApprovals() {
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: "approved" | "rejected" }) => {
      return apiRequest(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: status === "approved" ? "Utilizador Aprovado" : "Utilizador Rejeitado",
        description: status === "approved" 
          ? "O utilizador pode agora aceder à loja." 
          : "O registo foi rejeitado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estado do utilizador.",
        variant: "destructive",
      });
    },
  });

  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status === "approved");
  const rejectedUsers = users.filter((u) => u.status === "rejected");

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0].toUpperCase() || "U";
  };

  const UserCard = ({ user, showActions = false }: { user: User; showActions?: boolean }) => (
    <Card key={user.id} data-testid={`user-card-${user.id}`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback>{getInitials(user)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">
                  {user.firstName} {user.lastName}
                </h3>
                <Badge 
                  variant={user.status === "pending" ? "secondary" : user.status === "approved" ? "default" : "destructive"}
                  size="sm"
                >
                  {user.status === "pending" && "Pendente"}
                  {user.status === "approved" && "Aprovado"}
                  {user.status === "rejected" && "Rejeitado"}
                </Badge>
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground mt-3">
                {user.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.clinicName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{user.clinicName}</span>
                  </div>
                )}
                {user.specialty && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{user.specialty}</span>
                  </div>
                )}
              </div>

              {(user.nif || user.professionalLicense) && (
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t text-sm">
                  {user.nif && (
                    <div>
                      <span className="text-muted-foreground">NIF:</span>{" "}
                      <span className="font-medium">{user.nif}</span>
                    </div>
                  )}
                  {user.professionalLicense && (
                    <div>
                      <span className="text-muted-foreground">Cédula:</span>{" "}
                      <span className="font-medium">{user.professionalLicense}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex md:flex-col gap-2 md:justify-start">
              <Button
                onClick={() => approveMutation.mutate({ userId: user.id, status: "approved" })}
                disabled={approveMutation.isPending}
                className="flex-1 md:flex-initial"
                data-testid={`button-approve-${user.id}`}
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                onClick={() => approveMutation.mutate({ userId: user.id, status: "rejected" })}
                disabled={approveMutation.isPending}
                className="flex-1 md:flex-initial"
                data-testid={`button-reject-${user.id}`}
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-approvals-title">
          Aprovações de Utilizadores
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerir pedidos de acesso à plataforma
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2" data-testid="tab-pending">
            <Clock className="h-4 w-4" />
            Pendentes ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2" data-testid="tab-approved">
            <Check className="h-4 w-4" />
            Aprovados ({approvedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2" data-testid="tab-rejected">
            <X className="h-4 w-4" />
            Rejeitados ({rejectedUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Nenhuma aprovação pendente</h3>
                <p className="text-muted-foreground mt-1">
                  Todos os pedidos de acesso foram processados
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingUsers.map((user) => (
              <UserCard key={user.id} user={user} showActions />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6 space-y-4">
          {approvedUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum utilizador aprovado</p>
              </CardContent>
            </Card>
          ) : (
            approvedUsers.map((user) => <UserCard key={user.id} user={user} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6 space-y-4">
          {rejectedUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum utilizador rejeitado</p>
              </CardContent>
            </Card>
          ) : (
            rejectedUsers.map((user) => <UserCard key={user.id} user={user} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
