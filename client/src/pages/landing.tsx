import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Play,
  MessageCircle,
  ShoppingBag
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { SiWhatsapp } from "react-icons/si";
import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

const WHATSAPP_NUMBER = "351910060560";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Gostaria de solicitar acesso profissional à loja CARA.")}`;
const WHATSAPP_SUPPORT_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Preciso de ajuda com a loja CARA.")}`;



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

function TableRow({
  label,
  standard,
  result,
  isHighlight = false,
  isSuccess = false,
  delay = 0
}: {
  label: string;
  standard: string;
  result: string;
  isHighlight?: boolean;
  isSuccess?: boolean;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <tr
      ref={ref}
      className={`transition-all duration-500 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'} ${isHighlight ? 'bg-primary/5' : ''}`}
      style={{ transitionDelay: `${delay * 1000}ms` }}
    >
      <td className="px-6 py-4 font-medium">{label}</td>
      <td className={`px-6 py-4 ${isHighlight ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
        {standard}
      </td>
      <td className="px-6 py-4">
        <span className={`font-bold ${isHighlight ? 'text-primary' : isSuccess ? 'text-green-600 dark:text-green-400' : ''}`}>
          {result}
        </span>
      </td>
    </tr>
  );
}

function SafetyStatCard({
  icon: Icon,
  value,
  label,
  description,
  isHighlight = false,
  delay = 0
}: {
  icon: typeof Shield;
  value: string;
  label: string;
  description: string;
  isHighlight?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <Card className={`text-center p-6 h-full ${isHighlight ? 'border-primary border-2 shadow-lg shadow-primary/20' : ''} hover-elevate overflow-visible`}>
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isHighlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
          <Icon className={`w-8 h-8 ${isHighlight ? '' : 'text-primary'}`} />
        </div>
        <div className={`text-3xl font-bold mb-1 ${isHighlight ? 'text-primary' : ''}`}>{value}</div>
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </Card>
    </motion.div>
  );
}

interface Product {
  name: string;
  slug: string;
  description: string;
  particle: string;
  depth: string;
  needle: string;
  zones: string[];
}

function ProductCard({ product, index }: { product: Product; index: number }) {
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
  const { t } = useLanguage();
  const { user, isAuthenticated, isPending, isApproved, isRejected } = useAuth();
  const [activeProduct, setActiveProduct] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const products: Product[] = [
    {
      name: "SOFT",
      slug: "cara-soft",
      description: t("products.soft.description"),
      particle: "200 μm",
      depth: t("products.soft.depth"),
      needle: "30G TW",
      zones: [t("products.soft.zones.0"), t("products.soft.zones.1"), t("products.soft.zones.2"), t("products.soft.zones.3")]
    },
    {
      name: "MILD",
      slug: "cara-mild",
      description: t("products.mild.description"),
      particle: "400 μm",
      depth: t("products.mild.depth"),
      needle: "27G TW",
      zones: [t("products.mild.zones.0"), t("products.mild.zones.1"), t("products.mild.zones.2"), t("products.mild.zones.3")]
    },
    {
      name: "HARD",
      slug: "cara-hard",
      description: t("products.hard.description"),
      particle: "600 μm",
      depth: t("products.hard.depth"),
      needle: "25G/27G TW",
      zones: [t("products.hard.zones.0"), t("products.hard.zones.1"), t("products.hard.zones.2"), t("products.hard.zones.3")]
    },
    {
      name: "ULTRA",
      slug: "cara-ultra",
      description: t("products.ultra.description"),
      particle: "900 μm",
      depth: t("products.ultra.depth"),
      needle: "25G/27G TW",
      zones: [t("products.ultra.zones.0"), t("products.ultra.zones.1"), t("products.ultra.zones.2"), t("products.ultra.zones.3")]
    },
  ];

  const features = [
    {
      icon: Shield,
      title: t("features.safe.title"),
      description: t("features.safe.description"),
      stat: "< 0.5 EU/ml"
    },
    {
      icon: Sparkles,
      title: t("features.purity.title"),
      description: t("features.purity.description"),
      stat: "99.8%"
    },
    {
      icon: FlaskConical,
      title: t("features.tech.title"),
      description: t("features.tech.description"),
      stat: t("features.tech.stat")
    },
    {
      icon: Syringe,
      title: t("features.ergonomic.title"),
      description: t("features.ergonomic.description"),
      stat: t("features.ergonomic.stat")
    },
    {
      icon: Award,
      title: t("features.cert.title"),
      description: t("features.cert.description"),
      stat: t("features.cert.stat")
    },
    {
      icon: Heart,
      title: t("features.cruelty.title"),
      description: t("features.cruelty.description"),
      stat: "100%"
    },
  ];

  const stats = [
    { value: "18+", label: t("stats.experience"), icon: Clock },
    { value: "50+", label: t("stats.countries"), icon: Globe },
    { value: "10M+", label: t("stats.treatments"), icon: Users },
    { value: "99%", label: t("stats.satisfaction"), icon: Star },
  ];

  const certifications = [
    { name: "INFARMED", description: t("certifications.infarmed") },
    { name: "CE Mark", description: t("certifications.ce") },
    { name: "ISO 13485", description: t("certifications.iso13485") },
    { name: "KGMP", description: t("certifications.kgmp") },
    { name: "ISO 9001", description: t("certifications.iso9001") },
  ];

  const processSteps = [
    {
      step: 1,
      title: t("process.step1.title"),
      description: t("process.step1.description"),
      icon: FileCheck
    },
    {
      step: 2,
      title: t("process.step2.title"),
      description: t("process.step2.description"),
      icon: Clock
    },
    {
      step: 3,
      title: t("process.step3.title"),
      description: t("process.step3.description"),
      icon: Zap
    },
  ];

  const testimonials = [
    {
      name: "Dra. Ana Santos",
      role: t("testimonials.1.role"),
      quote: t("testimonials.1.quote"),
      rating: 5
    },
    {
      name: "Dr. Miguel Ferreira",
      role: t("testimonials.2.role"),
      quote: t("testimonials.2.quote"),
      rating: 5
    },
    {
      name: "Dra. Sofia Martins",
      role: t("testimonials.3.role"),
      quote: t("testimonials.3.quote"),
      rating: 5
    },
  ];

  const faqs = [
    {
      question: t("faq.1.question"),
      answer: t("faq.1.answer")
    },
    {
      question: t("faq.2.question"),
      answer: t("faq.2.answer")
    },
    {
      question: t("faq.3.question"),
      answer: t("faq.3.answer")
    },
    {
      question: t("faq.4.question"),
      answer: t("faq.4.answer")
    },
  ];

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
            {isAuthenticated && isPending && (
              <Alert className="text-left border-amber-200 bg-amber-50 text-foreground dark:bg-amber-900/20 dark:border-amber-900/40">
                <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                <div>
                  <AlertTitle>Conta pendente de aprovação</AlertTitle>
                  <AlertDescription>
                    Olá{user?.firstName ? `, ${user.firstName}` : ""}! Resposta da aprovação emitida em até 48 horas úteis.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {isAuthenticated && isRejected && (
              <Alert variant="destructive" className="text-left">
                <Shield className="h-4 w-4" />
                <div>
                  <AlertTitle>Acesso negado</AlertTitle>
                  <AlertDescription>
                    Infelizmente o seu pedido de acesso não foi aprovado. Por favor contacte-nos para mais informações.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                {t("hero.distributor")}
              </Badge>
            </div>

            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight animate-fade-in-up"
              style={{ animationDelay: '100ms' }}
            >
              {t("hero.title_part1")} <span className="text-primary">CARA</span> {t("hero.title_part2")}
              <br />
              <span className="text-4xl md:text-5xl lg:text-6xl font-medium text-muted-foreground">
                {t("hero.title_part3")}
              </span>
            </h1>

            <p
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '200ms' }}
            >
              {t("hero.subtitle")}
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              {!isAuthenticated && (
                <Link href="/login?tab=register">
                  <Button size="lg" className="gap-2 text-lg px-8 py-6" data-testid="button-hero-register">
                    <SiWhatsapp className="w-5 h-5" />
                    {t("hero.cta_whatsapp")}
                  </Button>
                </Link>
              )}

              {isAuthenticated && isPending && (
                <div className="flex flex-col items-center gap-3">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6"
                    disabled
                    data-testid="button-hero-register"
                  >
                    {t("hero.cta_pending")}
                  </Button>
                  <p className="text-sm text-muted-foreground max-w-xl text-center">
                    {t("hero.cta_pending_desc")}
                  </p>
                </div>
              )}

              {isAuthenticated && isApproved && null}
              <Link href="/sobre">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="button-hero-about">
                  <Play className="w-5 h-5 mr-2" />
                  {t("hero.cta_about")}
                </Button>
              </Link>
            </div>

            <div
              className="flex flex-wrap justify-center gap-8 pt-12 text-sm animate-fade-in"
              style={{ animationDelay: '400ms' }}
            >
              {[
                { icon: CheckCircle2, text: t("hero.badges.infarmed") },
                { icon: Award, text: t("hero.badges.iso13485") },
                { icon: Heart, text: t("hero.badges.cruelty_free") },
                { icon: Zap, text: t("hero.badges.delivery") },
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
              {t("portfolio.badge")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("portfolio.title_part1")} <span className="text-primary">CARA</span> {t("portfolio.title_part2")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t("portfolio.description")}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {products.map((product, index) => (
              <ProductCard key={product.slug} product={product} index={index} />
            ))}
          </div>

          <AnimatedSection className="text-center">
            <Link href="/produtos">
              <Button variant="outline" size="lg" className="gap-2" data-testid="button-view-catalog">
                {t("portfolio.view_catalog")}
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
                {t("science.badge")}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t("science.title_part1")} <span className="text-primary">Hy-Brid</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t("science.description")}
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{t("science.features.uniform.title")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("science.features.uniform.description")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{t("science.features.collagen.title")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("science.features.collagen.description")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{t("science.features.safety.title")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("science.features.safety.description")}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <Card className="p-8 bg-background">
                <h3 className="text-2xl font-bold mb-6 text-center">{t("science.specs.title")}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">{t("science.specs.ha_conc")}</span>
                    <span className="font-bold text-primary">24 mg/ml</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">{t("science.specs.molecular_weight")}</span>
                    <span className="font-bold">3.000.000 Da</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">{t("science.specs.lidocaine")}</span>
                    <span className="font-bold">3%</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-muted-foreground">{t("science.specs.volume")}</span>
                    <span className="font-bold">1.1 ml</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground">{t("science.specs.duration")}</span>
                    <span className="font-bold text-primary">{t("science.specs.duration_value")}</span>
                  </div>
                </div>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Safety Performance Section - WOW Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-pulse" />

        <div className="container mx-auto px-4 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 animate-bounce">
              <Shield className="w-3 h-3 mr-1" />
              {t("safety.badge")}
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                {t("safety.title_part1")}
              </span>
              {" "}{t("safety.title_part2")}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
              {t("safety.description")}
            </p>
          </AnimatedSection>

          {/* Performance Test Table */}
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-primary" />
                  </div>
                  {t("safety.table_title")} | <span className="text-primary">CARA</span>
                </h3>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">{t("safety.table.header.appearance")}</th>
                        <th className="px-6 py-4 text-left font-semibold">{t("safety.table.header.standard")}</th>
                        <th className="px-6 py-4 text-left font-semibold">{t("safety.table.header.result")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <TableRow
                        label="HA3"
                        standard={t("safety.table.ha3.standard")}
                        result={t("safety.table.ha3.result")}
                        isSuccess
                        delay={0}
                      />
                      <TableRow
                        label="Concentracao"
                        standard="21.6 ~ 26.4 mg"
                        result="24.1 mg"
                        delay={0.1}
                      />
                      <TableRow
                        label="pH"
                        standard="6.5 ~ 7.5"
                        result="7.10"
                        delay={0.2}
                      />
                      <TableRow
                        label={t("safety.table.bdde.label")}
                        standard="< 2 ppm"
                        result={t("safety.table.bdde.result")}
                        isHighlight
                        delay={0.3}
                      />
                      <TableRow
                        label={t("safety.table.endotoxin.label")}
                        standard="< 20 EU"
                        result="< 0.100 EU"
                        isHighlight
                        delay={0.4}
                      />
                      <TableRow
                        label={t("safety.table.volume.label")}
                        standard="> 1.0 mL"
                        result={t("safety.table.volume.result")}
                        isSuccess
                        delay={0.5}
                      />
                    </tbody>
                  </table>
                </div>
                <div className="bg-muted/30 px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{t("safety.bdde.question")}</span> {t("safety.bdde.answer")}
                  </p>
                  <p className="text-sm font-bold text-primary mt-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t("safety.bdde.result_text")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Animated Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <SafetyStatCard
              icon={Shield}
              value="< 0.1 EU"
              label={t("safety.stats.endotoxin.label")}
              description={t("safety.stats.endotoxin.description")}
              delay={0.2}
            />
            <SafetyStatCard
              icon={Sparkles}
              value="0 ppm"
              label={t("safety.stats.bdde.label")}
              description={t("safety.stats.bdde.description")}
              isHighlight
              delay={0.4}
            />
            <SafetyStatCard
              icon={Award}
              value="100%"
              label={t("safety.stats.compliance.label")}
              description={t("safety.stats.compliance.description")}
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Award className="w-3 h-3 mr-1" />
              {t("features.badge")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("features.title_part1")} <span className="text-primary">CARA</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t("features.description")}
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
              {t("process.badge")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("process.title_part1")} <span className="text-primary">{t("process.title_part2")}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t("process.description")}
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
              {t("testimonials.badge")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("testimonials.title_part1")} <span className="text-primary">{t("testimonials.title_part2")}</span>
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
              {t("faq.badge")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("faq.title_part1")} <span className="text-primary">{t("faq.title_part2")}</span>
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
                        className={`w-5 h-5 text-primary transition-transform flex-shrink-0 ${openFaq === index ? "rotate-90" : ""
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
                {t("contact.badge")}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t("contact.title_part1")} <span className="text-primary">{t("contact.title_part2")}</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("contact.description")}
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contact.phone_label")}</p>
                    <p className="font-semibold">+351 210 000 000</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contact.email_label")}</p>
                    <p className="font-semibold">info@cara.pt</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contact.address_label")}</p>
                    <p className="font-semibold">Lisboa, Portugal</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("contact.hours_label")}</p>
                    <p className="font-semibold">{t("contact.hours_value")}</p>
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
                      {t("contact.distributor.title")}
                    </h3>
                    <p className="opacity-90">
                      {t("contact.distributor.description")}
                    </p>
                  </div>

                  <div className="border-t border-primary-foreground/20 pt-6 space-y-3">
                    <div className="flex items-center gap-3 opacity-90">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t("contact.distributor.stock")}</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-90">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t("contact.distributor.delivery")}</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-90">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t("contact.distributor.support")}</span>
                    </div>
                    <div className="flex items-center gap-3 opacity-90">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t("contact.distributor.training")}</span>
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
              {t("cta.title")}
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              {t("cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {!isAuthenticated && (
                <Link href="/login?tab=register">
                  <Button size="lg" variant="secondary" className="gap-2 text-lg px-8 py-6" data-testid="button-cta-register">
                    <SiWhatsapp className="w-5 h-5" />
                    {t("cta.button_whatsapp")}
                  </Button>
                </Link>
              )}

              {isAuthenticated && isPending && (
                <div className="flex flex-col items-center gap-3">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8 py-6"
                    disabled
                    data-testid="button-cta-register"
                  >
                    {t("cta.button_pending")}
                  </Button>
                  <p className="text-sm opacity-90 max-w-xl text-center">
                    {t("cta.pending_desc")}
                  </p>
                </div>
              )}

              {isAuthenticated && isApproved ? (
                <Link href="/produtos">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                    data-testid="button-cta-products"
                  >
                    <ShoppingBag className="mr-2 w-5 h-5" />
                    {t("cta.button_products")}
                  </Button>
                </Link>
              ) : (
                <Link href="/contacto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                    data-testid="button-cta-contact"
                  >
                    <Phone className="mr-2 w-5 h-5" />
                    {t("cta.button_contact")}
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Floating WhatsApp Support Button */}
      <a
        href={WHATSAPP_SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-xl animate-float group"
        data-testid="button-whatsapp-support"
        aria-label="Suporte WhatsApp"
      >
        <SiWhatsapp className="w-8 h-8 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
          1
        </span>
      </a>
    </div>
  );
}
