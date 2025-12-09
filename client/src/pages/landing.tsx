import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Sparkles, 
  Award, 
  FlaskConical, 
  Syringe, 
  CheckCircle2,
  ArrowRight,
  Star
} from "lucide-react";
import { motion } from "framer-motion";

const products = [
  { name: "SOFT", slug: "cara-soft", color: "bg-sky-500", description: "Rugas finas, olheiras", particle: "200 μm" },
  { name: "MILD", slug: "cara-mild", color: "bg-emerald-500", description: "Rugas médias, glabela", particle: "400 μm" },
  { name: "HARD", slug: "cara-hard", color: "bg-amber-500", description: "Sulcos profundos", particle: "600 μm" },
  { name: "ULTRA", slug: "cara-ultra", color: "bg-purple-500", description: "Rinomodelação, mandíbula", particle: "900 μm" },
];

const features = [
  {
    icon: Shield,
    title: "Seguro para Pacientes",
    description: "Baixo nível de endotoxina e resíduo BDDE indetectável, minimizando riscos de reações adversas.",
  },
  {
    icon: Sparkles,
    title: "Alta Pureza",
    description: "Rigoroso controle de qualidade em todo o processo de produção, do material base ao produto final.",
  },
  {
    icon: FlaskConical,
    title: "Tecnologia Hy-Brid",
    description: "Partículas de tamanho uniforme que mantêm volume duradouro e promovem produção de colagénio.",
  },
  {
    icon: Syringe,
    title: "Design Ergonómico",
    description: "Haste e punho projetados para distribuição uniforme de pressão durante a injeção.",
  },
  {
    icon: Award,
    title: "Certificações Globais",
    description: "KGMP, ISO 13485, ISO 9001, registo no INFARMED e distribuição pela PROMIPHARM.",
  },
  {
    icon: CheckCircle2,
    title: "Cruelty Free",
    description: "Produção não animal, livre de testes em animais, comprometida com práticas éticas.",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Landing() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div {...fadeInUp}>
              <Badge variant="secondary" className="mb-4 px-4 py-1.5">
                <Star className="w-3 h-3 mr-1.5 fill-current" />
                Líder em Inovação Médica
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              A <span className="text-primary">CARA</span> perfeita{" "}
              <br className="hidden sm:block" />
              para todas as caras
            </motion.h1>
            
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Ácido Hialurónico reticulado premium com Lidocaína 3%, desenvolvido para profissionais médicos que exigem excelência em cada procedimento.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <a href="/api/login">
                <Button size="lg" className="gap-2" data-testid="button-hero-register">
                  Solicitar Acesso Profissional
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Link href="/sobre">
                <Button size="lg" variant="outline" data-testid="button-hero-about">
                  Conhecer a CARA
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Registado no INFARMED
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                ISO 13485 Certificado
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Cruelty Free
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha a CARA Certa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quatro formulações desenvolvidas para diferentes necessidades de tratamento, cada uma com especificações técnicas precisas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover-elevate overflow-visible group">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`w-20 h-20 mx-auto rounded-full ${product.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                      <span className="text-white font-bold text-lg">CARA</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">CARA {product.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                    </div>
                    <Badge variant="secondary" size="sm">
                      Partícula: {product.particle}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a href="/api/login">
              <Button variant="outline" size="lg" data-testid="button-view-catalog">
                Ver Catálogo Completo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Porquê Escolher CARA?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Desenvolvido pelo laboratório GENOSS, líder em inovação médica há mais de 18 anos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Especificações Técnicas
              </h2>
              <p className="text-muted-foreground">
                Todas as fórmulas CARA contêm 24mg/ml de Ácido Hialurónico com peso molecular de 3 milhões de Dalton.
              </p>
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold">Produto</th>
                      <th className="text-left p-4 font-semibold">Partícula</th>
                      <th className="text-left p-4 font-semibold">Profundidade</th>
                      <th className="text-left p-4 font-semibold">Agulhas</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4 font-medium">CARA SOFT</td>
                      <td className="p-4">200 μm</td>
                      <td className="p-4">Superficial</td>
                      <td className="p-4">2x 30G TW</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">CARA MILD</td>
                      <td className="p-4">400 μm</td>
                      <td className="p-4">Superficial a Média</td>
                      <td className="p-4">2x 27G TW</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">CARA HARD</td>
                      <td className="p-4">600 μm</td>
                      <td className="p-4">Média a Profunda</td>
                      <td className="p-4">25G TW, 27G TW</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">CARA ULTRA</td>
                      <td className="p-4">900 μm</td>
                      <td className="p-4">Profunda</td>
                      <td className="p-4">25G TW, 27G TW</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground border-primary-border">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Pronto para Elevar os Seus Tratamentos?
              </h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
                Junte-se aos profissionais médicos que confiam na CARA para resultados excepcionais. Solicite o seu acesso agora.
              </p>
              <a href="/api/login">
                <Button size="lg" variant="secondary" className="mt-4" data-testid="button-cta-register">
                  Solicitar Acesso Profissional
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
