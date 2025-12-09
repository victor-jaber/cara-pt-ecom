import { Clock, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function PendingApproval() {
  const { user } = useAuth();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Conta Pendente de Aprovação</CardTitle>
          <CardDescription className="text-base">
            Olá{user?.firstName ? `, ${user.firstName}` : ""}! O seu pedido de acesso está em análise pela nossa equipa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Próximos passos:</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">1.</span>
                A nossa equipa irá verificar as suas credenciais profissionais
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">2.</span>
                Receberá um email assim que a sua conta for aprovada
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">3.</span>
                Após aprovação, terá acesso completo ao catálogo de produtos
              </li>
            </ul>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Tempo médio de aprovação: 24-48 horas úteis
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:geral@cara.com.pt">
                  <Mail className="mr-2 h-4 w-4" />
                  geral@cara.com.pt
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="tel:+351910060560">
                  <Phone className="mr-2 h-4 w-4" />
                  +351 910 060 560
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
