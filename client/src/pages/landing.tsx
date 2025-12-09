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
  Star,
  Users,
  Clock,
  Phone,
  Mail,
  MapPin,
  Zap,
  Heart,
  Target,
  TrendingUp,
  GraduationCap,
  FileCheck,
  Microscope,
  Building2,
  Globe,
  Play
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const products = [
  { 
    name: "SOFT", 
    slug: "cara-soft", 
    description: "Rugas finas, olheiras, linhas periorais", 
    particle: "200 μm",
    depth: "Superficial",
    needle: "30G TW",
    zones: ["Rugas periorbitais", "Olheiras", "Linhas periorais", "Mesoterapia facial"]
  },
  { 
    name: "MILD", 
    slug: "cara-mild", 
    description: "Rugas médias, glabela, contorno labial", 
    particle: "400 μm",
    depth: "Superficial a Média",
    needle: "27G TW",
    zones: ["Rugas nasolabiais", "Linhas de marioneta", "Contorno labial", "Glabela"]
  },
  { 
    name: "HARD", 
    slug: "cara-hard", 
    description: "Sulcos profundos, volumetria facial", 
    particle: "600 μm",
    depth: "Média a Profunda",
    needle: "25G/27G TW",
    zones: ["Sulcos profundos", "Volumetria malar", "Preenchimento zigomático", "Contorno facial"]
  },
  { 
    name: "ULTRA", 
    slug: "cara-ultra", 
    description: "Rinomodelação, mandíbula, contorno", 
    particle: "900 μm",
    depth: "Profunda",
    needle: "25G/27G TW",
    zones: ["Rinomodelação", "Mandíbula", "Mento", "Volumetria facial"]
  },
];

const features = [
  {
    icon: Shield,
    title: "Seguro para Pacientes",
    description: "Baixo nível de endotoxina e resíduo BDDE indetectável, minimizando riscos de reações adversas.",
    stat: "< 0.5 EU/ml"
  },
  {
    icon: Sparkles,
    title: "Alta Pureza",
    description: "Rigoroso controle de qualidade em todo o processo de produção, do material base ao produto final.",
    stat: "99.8%"
  },
  {
    icon: FlaskConical,
    title: "Tecnologia Hy-Brid",
    description: "Partículas de tamanho uniforme que mantêm volume duradouro e promovem produção de colagénio.",
    stat: "Patenteado"
  },
  {
    icon: Syringe,
    title: "Design Ergonómico",
    description: "Haste e punho projetados para distribuição uniforme de pressão durante a injeção.",
    stat: "Conforto+"
  },
  {
    icon: Award,
    title: "Certificações Globais",
    description: "KGMP, ISO 13485, ISO 9001, registo no INFARMED e distribuição pela PROMIPHARM.",
    stat: "5 Certificações"
  },
  {
    icon: Heart,
    title: "Cruelty Free",
    description: "Produção não animal, livre de testes em animais, comprometida com práticas éticas.",
    stat: "100%"
  },
];

const stats = [
  { value: "18+", label: "Anos de Experiência", icon: Clock },
  { value: "50+", label: "Países", icon: Globe },
  { value: "10M+", label: "Tratamentos", icon: Users },
  { value: "99%", label: "Satisfação", icon: Star },
];

const certifications = [
  { name: "INFARMED", description: "Registado em Portugal" },
  { name: "CE Mark", description: "Conformidade Europeia" },
  { name: "ISO 13485", description: "Dispositivos Médicos" },
  { name: "KGMP", description: "Boas Práticas de Fabrico" },
  { name: "ISO 9001", description: "Gestão de Qualidade" },
];

const processSteps = [
  { 
    step: 1, 
    title: "Registo Profissional", 
    description: "Crie a sua conta e submeta as credenciais médicas para verificação.",
    icon: FileCheck
  },
  { 
    step: 2, 
    title: "Aprovação Rápida", 
    description: "A nossa equipa analisa e aprova o seu acesso em até 24 horas úteis.",
    icon: Clock
  },
  { 
    step: 3, 
    title: "Acesso Completo", 
    description: "Explore o catálogo, preços exclusivos e faça as suas encomendas.",
    icon: Zap
  },
];

const testimonials = [
  {
    name: "Dra. Ana Santos",
    role: "Medicina Estética, Lisboa",
    quote: "A qualidade dos produtos CARA é incomparável. Os meus pacientes notam a diferença nos resultados.",
    rating: 5
  },
  {
    name: "Dr. Miguel Ferreira",
    role: "Dermatologista, Porto",
    quote: "A tecnologia Hy-Brid proporciona resultados naturais e duradouros. Recomendo a todos os colegas.",
    rating: 5
  },
  {
    name: "Dra. Sofia Martins",
    role: "Cirurgia Plástica, Braga",
    quote: "O suporte técnico da CARA é excelente. Sempre disponíveis para esclarecer dúvidas.",
    rating: 5
  },
];

const faqs = [
  {
    question: "Quem pode comprar produtos CARA?",
    answer: "Apenas profissionais médicos qualificados e verificados podem adquirir os nossos produtos. Isto inclui médicos com especialização em dermatologia, cirurgia plástica, medicina estética e áreas relacionadas."
  },
  {
    question: "Quanto tempo demora a aprovação?",
    answer: "O processo de verificação profissional é normalmente concluído em 24 horas úteis após a submissão de todos os documentos necessários."
  },
  {
    question: "Os produtos têm registo no INFARMED?",
    answer: "Sim, todos os produtos CARA estão devidamente registados no INFARMED e cumprem com todas as regulamentações europeias para dispositivos médicos."
  },
  {
    question: "Qual é o prazo de entrega?",
    answer: "Entregas em Portugal Continental são realizadas em 24-48 horas úteis. Ilhas e outros destinos podem ter prazos diferentes."
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </div>
  );
}

function ProductCard({ product, index }: { product: typeof products[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-400 ease-out ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ 
        transitionDelay: `${index * 50}ms`,
        willChange: 'opacity, transform'
      }}
    >
      <Card className="h-full overflow-visible group relative">
        <CardContent className="p-6 space-y-4">
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-105">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CARA</span>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs"
            >
              {product.particle}
            </Badge>
          </div>
          
          <div className="text-center pt-4">
            <h3 className="text-xl font-bold text-primary">CARA {product.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
          </div>
          
          <div className="space-y-2 pt-2 overflow-hidden max-h-0 group-hover:max-h-40 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Profundidade:</span>
              <span className="font-medium">{product.depth}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Agulha:</span>
              <span className="font-medium">{product.needle}</span>
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Indicações:</p>
              <div className="flex flex-wrap gap-1">
                {product.zones.slice(0, 2).map((zone) => (
                  <Badge key={zone} variant="outline" className="text-xs">
                    {zone}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CountUp({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <span ref={ref} className="tabular-nums">
      {isInView ? value : "0"}{suffix}
    </span>
  );
}

export default function Landing() {
  const [activeProduct, setActiveProduct] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col">
      {/* Hero Section - Full viewport immersive */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
        
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                Distribuidor Oficial em Portugal
              </Badge>
            </div>
            
            <h1 
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              A <span className="text-primary">CARA</span> perfeita
              <br />
              <span className="text-4xl md:text-5xl lg:text-6xl font-medium text-muted-foreground">
                para cada tratamento
              </span>
            </h1>
            
            <p 
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              Ácido Hialurónico reticulado premium com <strong className="text-foreground">Lidocaína 3%</strong>, 
              desenvolvido para profissionais médicos que exigem excelência em cada procedimento.
            </p>
            
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              <a href="/api/login">
                <Button size="lg" className="gap-2 text-lg px-8 py-6" data-testid="button-hero-register">
                  Solicitar Acesso Profissional
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
              <Link href="/sobre">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="button-hero-about">
                  <Play className="w-5 h-5 mr-2" />
                  Conhecer a CARA
                </Button>
              </Link>
            </div>

            <div 
              className="flex flex-wrap justify-center gap-8 pt-12 text-sm animate-fade-in"
              style={{ animationDelay: '400ms' }}
            >
              {[
                { icon: CheckCircle2, text: "Registado no INFARMED" },
                { icon: Award, text: "ISO 13485 Certificado" },
                { icon: Heart, text: "Cruelty Free" },
                { icon: Zap, text: "Entrega 24-48h" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-muted-foreground">
                  <item.icon className="w-5 h-5 text-primary" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const ref = useRef(null);
              const isInView = useInView(ref, { once: true, margin: "-30px" });
              return (
                <div
                  key={stat.label}
                  ref={ref}
                  className={`text-center transition-all duration-400 ease-out ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                  <div className="text-4xl md:text-5xl font-bold mb-1">
                    <CountUp value={stat.value} />
                  </div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certifications Bar */}
      <AnimatedSection className="py-12 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {certifications.map((cert) => (
              <div key={cert.name} className="text-center group">
                <div className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {cert.name}
                </div>
                <div className="text-xs text-muted-foreground">{cert.description}</div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Products Interactive Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <FlaskConical className="w-3 h-3 mr-1" />
              Portfólio Completo
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Escolha a <span className="text-primary">CARA</span> Certa
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Quatro formulações desenvolvidas para diferentes necessidades de tratamento, 
              cada uma com especificações técnicas precisas para resultados excepcionais.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {products.map((product, index) => (
              <ProductCard key={product.slug} product={product} index={index} />
            ))}
          </div>

          <AnimatedSection className="text-center">
            <Link href="/login">
              <Button variant="outline" size="lg" className="gap-2" data-testid="button-view-catalog">
                Ver Catálogo Completo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Science Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <Badge variant="secondary" className="mb-4">
                <Microscope className="w-3 h-3 mr-1" />
                Ciência & Inovação
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Tecnologia <span className="text-primary">Hy-Brid</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                O laboratório GENOSS desenvolveu uma tecnologia patenteada que combina 
                partículas de ácido hialurónico com tamanho uniforme, proporcionando 
                resultados mais naturais e duradouros.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Partículas Uniformes</h4>
                    <p className="text-sm text-muted-foreground">
                      Distribuição consistente para resultados previsíveis e naturais
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Estimula Colagénio</h4>
                    <p className="text-sm text-muted-foreground">
                      Promove a produção natural de colagénio para resultados prolongados
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Máxima Segurança</h4>
                    <p className="text-sm text-muted-foreground">
                      Resíduo BDDE indetectável e baixo nível de endotoxina
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection>
              <Card className="p-8 bg-background">
                <h3 className="text-2xl font-bold mb-6 text-center">Especificações Técnicas</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Concentração HA</span>
                    <span className="font-bold text-primary">24 mg/ml</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Peso Molecular</span>
                    <span className="font-bold">3.000.000 Da</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Lidocaína</span>
                    <span className="font-bold">3%</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">Volume/Seringa</span>
                    <span className="font-bold">1.1 ml</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground">Duração Média</span>
                    <span className="font-bold text-primary">12-18 meses</span>
                  </div>
                </div>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Award className="w-3 h-3 mr-1" />
              Vantagens Competitivas
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Porquê Escolher <span className="text-primary">CARA</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Desenvolvido pelo laboratório GENOSS, líder em inovação médica há mais de 18 anos.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover-elevate overflow-visible group">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="w-7 h-7 text-primary" />
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {feature.stat}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <GraduationCap className="w-3 h-3 mr-1" />
              Processo Simples
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como <span className="text-primary">Começar</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              O seu acesso profissional está a três passos de distância.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {processSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-primary/20" />
                )}
                <Card className="text-center h-full">
                  <CardContent className="p-8 space-y-4">
                    <div className="relative inline-block">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                        <item.icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-primary">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Users className="w-3 h-3 mr-1" />
              Testemunhos
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O Que Dizem os <span className="text-primary">Profissionais</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                    <div className="pt-4 border-t">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <FileCheck className="w-3 h-3 mr-1" />
              Dúvidas Frequentes
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Perguntas <span className="text-primary">Frequentes</span>
            </h2>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card 
                  className="cursor-pointer hover-elevate overflow-visible"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  data-testid={`card-faq-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center gap-4">
                      <h3 className="font-semibold text-lg">{faq.question}</h3>
                      <ArrowRight 
                        className={`w-5 h-5 text-primary transition-transform flex-shrink-0 ${
                          openFaq === index ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: openFaq === index ? "auto" : 0,
                        opacity: openFaq === index ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-muted-foreground pt-4">{faq.answer}</p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            <AnimatedSection>
              <Badge variant="secondary" className="mb-4">
                <Phone className="w-3 h-3 mr-1" />
                Contacto
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Precisa de <span className="text-primary">Ajuda</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                A nossa equipa está disponível para esclarecer todas as suas dúvidas 
                e ajudá-lo no processo de registo profissional.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-semibold">+351 210 000 000</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">info@cara.pt</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Morada</p>
                    <p className="font-semibold">Lisboa, Portugal</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-semibold">Seg-Sex: 9h-18h</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection>
              <Card className="bg-primary text-primary-foreground border-primary-border">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center space-y-4">
                    <Building2 className="w-16 h-16 mx-auto opacity-90" />
                    <h3 className="text-2xl font-bold">
                      Distribuidor Oficial Portugal
                    </h3>
                    <p className="opacity-90">
                      PROMIPHARM é o distribuidor exclusivo dos produtos CARA 
                      em território português, garantindo qualidade e suporte local.
                    </p>
                  </div>
                  
                  <div className="border-t border-primary-foreground/20 pt-6 space-y-3">
                    <div className="flex items-center gap-3 opacity-90">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Stock permanente em Portugal</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-90">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Entregas em 24-48 horas</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-90">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Suporte técnico em português</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-90">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Formação e workshops</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center space-y-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold">
              Pronto para Elevar os Seus Tratamentos?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Junte-se aos profissionais médicos que confiam na CARA para resultados 
              excepcionais. Solicite o seu acesso agora e comece a transformar vidas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a href="/api/login">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid="button-cta-register">
                  Solicitar Acesso Profissional
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <Link href="/contacto">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-cta-contact">
                  <Phone className="mr-2 w-5 h-5" />
                  Falar Connosco
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
