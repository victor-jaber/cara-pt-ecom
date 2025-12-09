import { Link, useLocation } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";
import { SiInstagram, SiFacebook, SiWhatsapp } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";

export function Footer() {
  const { isApproved } = useAuth();
  const [, setLocation] = useLocation();

  const handleProductClick = (e: React.MouseEvent, href: string) => {
    if (!isApproved) {
      e.preventDefault();
      window.scrollTo(0, 0);
      setLocation("/login");
    }
  };

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <span className="text-2xl font-bold tracking-tight text-primary">CARA</span>
            <p className="text-sm text-muted-foreground">
              Ácido Hialurónico Premium para Profissionais Médicos. Desenvolvido pelo laboratório GENOSS, líder em inovação médica.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/cara.portugal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-instagram"
              >
                <SiInstagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/cara.com.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-facebook"
              >
                <SiFacebook className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/351910060560"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-whatsapp"
              >
                <SiWhatsapp className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Produtos</h4>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/produto/cara-soft" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => handleProductClick(e, "/produto/cara-soft")}
              >
                CARA SOFT
              </Link>
              <Link 
                href="/produto/cara-mild" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => handleProductClick(e, "/produto/cara-mild")}
              >
                CARA MILD
              </Link>
              <Link 
                href="/produto/cara-hard" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => handleProductClick(e, "/produto/cara-hard")}
              >
                CARA HARD
              </Link>
              <Link 
                href="/produto/cara-ultra" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => handleProductClick(e, "/produto/cara-ultra")}
              >
                CARA ULTRA
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Informações</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sobre Nós
              </Link>
              <Link href="/contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contacto
              </Link>
              <Link href="/termos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Termos e Condições
              </Link>
              <Link href="/privacidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Contactos</h4>
            <div className="flex flex-col gap-3">
              <a
                href="tel:+351910060560"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                +351 910 060 560
              </a>
              <a
                href="mailto:geral@cara.com.pt"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                geral@cara.com.pt
              </a>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>1600-428 Lisboa, Portugal</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Registado no INFARMED na plataforma INFODM
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} CARA. Todos os direitos reservados.
            </p>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Desenvolvido por{" "}
              <a 
                href="https://jabertechnology.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline"
                data-testid="link-jaber-technology"
              >
                Jaber Technology Ltda
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
