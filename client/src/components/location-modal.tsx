import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, Globe, Stethoscope, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { UserLocation } from "@/hooks/useLocation";

interface LocationModalProps {
  open: boolean;
  onSelectLocation: (location: UserLocation) => void;
}

export function LocationModal({ open, onSelectLocation }: LocationModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Bem-vindo ao CARA</DialogTitle>
          <DialogDescription>
            Por favor, selecione a sua localização para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => onSelectLocation("portugal")}
            data-testid="button-location-portugal"
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Portugal</h3>
                <p className="text-sm text-muted-foreground">
                  Acesso para profissionais de saúde em Portugal
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => onSelectLocation("international")}
            data-testid="button-location-international"
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Globe className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Internacional</h3>
                <p className="text-sm text-muted-foreground">
                  Acesso internacional para profissionais de saúde
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MedicalConfirmationModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MedicalConfirmationModal({
  open,
  onConfirm,
  onCancel,
}: MedicalConfirmationModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Medical Professional Verification</DialogTitle>
          </div>
          <DialogDescription>
            CARA products are medical-grade hyaluronic acid dermal fillers intended for use by licensed healthcare professionals only.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Important Notice</p>
                <p>
                  These products should only be administered by qualified medical professionals
                  with appropriate training in dermal filler procedures.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start space-x-3 py-2">
            <Checkbox
              id="medical-confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              data-testid="checkbox-medical-confirmation"
            />
            <Label
              htmlFor="medical-confirm"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I confirm that I am a licensed healthcare professional authorized to purchase
              and administer dermal filler products in my jurisdiction.
            </Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            data-testid="button-cancel-confirmation"
          >
            Go Back
          </Button>
          <Button
            className="flex-1"
            disabled={!confirmed}
            onClick={handleConfirm}
            data-testid="button-confirm-medical"
          >
            Confirm & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
