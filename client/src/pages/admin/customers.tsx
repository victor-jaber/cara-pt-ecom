import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Building2,
  FileText,
  MapPin,
  Calendar
} from "lucide-react";
import type { User } from "@shared/schema";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { getUserInitials } from "@/lib/utils";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("approved");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const getInitials = (user: User) => getUserInitials(user, "U");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.clinicName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const isCustomer = user.role === "customer";

    return matchesSearch && matchesStatus && isCustomer;
  });

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-customers-title">
          Clientes
        </h1>
        <p className="text-muted-foreground mt-1">
          Lista de profissionais registados
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, email ou clínica..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-customers"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground mt-1">
              {search || statusFilter !== "all"
                ? "Tente ajustar os filtros de pesquisa"
                : "Ainda não existem clientes registados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedUser(user)}
              data-testid={`customer-card-${user.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <Badge
                        variant={
                          user.status === "approved"
                            ? "default"
                            : user.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {user.status === "approved" && "Aprovado"}
                        {user.status === "pending" && "Pendente"}
                        {user.status === "rejected" && "Rejeitado"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {user.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      )}
                      {user.clinicName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {user.clinicName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Detalhes do Cliente
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.profileImageUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <Badge
                      variant={
                        selectedUser.status === "approved"
                          ? "default"
                          : selectedUser.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {selectedUser.status === "approved" && "Aprovado"}
                      {selectedUser.status === "pending" && "Pendente"}
                      {selectedUser.status === "rejected" && "Rejeitado"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedUser.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.email}</span>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                  {selectedUser.clinicName && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.clinicName}</span>
                    </div>
                  )}
                  {selectedUser.clinicAddress && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.clinicAddress}</span>
                    </div>
                  )}
                  {selectedUser.specialty && (
                    <div className="flex items-center gap-3 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.specialty}</span>
                    </div>
                  )}
                  {selectedUser.createdAt && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Registado em{" "}
                        {format(new Date(selectedUser.createdAt), "d 'de' MMMM 'de' yyyy", {
                          locale: pt,
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {(selectedUser.nif || selectedUser.professionalLicense) && (
                  <div className="pt-4 border-t space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Dados Profissionais
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedUser.nif && (
                        <div>
                          <span className="text-sm text-muted-foreground">NIF:</span>{" "}
                          <span className="font-medium">{selectedUser.nif}</span>
                        </div>
                      )}
                      {selectedUser.professionalLicense && (
                        <div>
                          <span className="text-sm text-muted-foreground">Cédula:</span>{" "}
                          <span className="font-medium">{selectedUser.professionalLicense}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
