import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminShipping() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Fretes</h1>
          <p className="text-sm text-muted-foreground">
            Os fretes são hardcoded no servidor e não podem ser editados pelo admin.
          </p>
        </div>
        <Badge variant="secondary">Somente leitura</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras Atuais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-semibold">Envio Grátis</div>
            <div className="text-sm text-muted-foreground">
              Disponível apenas para pedidos acima de €500 (todas as localizações).
            </div>
          </div>

          <div>
            <div className="font-semibold">Envio Standard</div>
            <div className="text-sm text-muted-foreground">
              €7 — Entrega 1 a 2 dias — Apenas Portugal Continental.
            </div>
          </div>

          <div>
            <div className="font-semibold">Envio Ilhas</div>
            <div className="text-sm text-muted-foreground">
              €16 — Entrega 2-5 dias úteis — Apenas Açores e Madeira.
            </div>
          </div>

          <div>
            <div className="font-semibold">DHL UE - Via Terrestre</div>
            <div className="text-sm text-muted-foreground">
              €19 — Entrega 3-5 dias úteis — Apenas União Europeia (exceto Portugal).
            </div>
          </div>

          <div>
            <div className="font-semibold">DHL UE - Via Aérea</div>
            <div className="text-sm text-muted-foreground">
              €25 — Entrega 1-2 dias úteis — Apenas União Europeia (exceto Portugal).
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
