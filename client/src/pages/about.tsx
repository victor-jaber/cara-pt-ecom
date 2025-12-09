import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Award, 
  Beaker, 
  Building2,
  CheckCircle2
} from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: Beaker,
      title: "Tecnologia Avançada",
      description:
        "Desenvolvido com a mais avançada tecnologia de reticulação, garantindo máxima segurança e resultados naturais.",
    },
    {
      icon: Shield,
      title: "Segurança Certificada",
      description:
        "Registado no INFARMED com certificação KGMP e ISO 13485, cumprindo os mais rigorosos padrões europeus.",
    },
    {
      icon: Award,
      title: "Qualidade Premium",
      description:
        "Ácido hialurónico de elevada pureza (>99%), produzido em instalações de última geração na Coreia do Sul.",
    },
    {
      icon: Building2,
      title: "Suporte Especializado",
      description:
        "Equipa de profissionais dedicados ao suporte técnico e formação contínua para profissionais de saúde.",
    },
  ];

  const certifications = [
    "Registo INFARMED",
    "Certificação CE",
    "KGMP (Korean Good Manufacturing Practice)",
    "ISO 13485:2016",
    "ISO 22716:2007",
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-about-title">
          Sobre a CARA
        </h1>
        <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
          Excelência em preenchimentos de ácido hialurónico para profissionais médicos em Portugal
        </p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <p>
          A CARA representa uma nova era em preenchimentos dérmicos de ácido hialurónico, 
          combinando a mais avançada tecnologia coreana com rigorosos padrões de qualidade europeus.
        </p>
        <p>
          Desenvolvida pelo laboratório GENOSS, líder mundial em biotecnologia, a linha CARA 
          oferece uma gama completa de fillers monofásicos, cada um otimizado para aplicações 
          específicas — desde o tratamento de rugas finas até volumização facial profunda.
        </p>
        <p>
          A nossa missão é fornecer aos profissionais de saúde portugueses produtos de qualidade 
          excepcional, apoiados por um serviço personalizado e formação contínua, permitindo 
          resultados estéticos naturais e duradouros para os seus pacientes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="p-6">
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Certificações e Registos</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {certifications.map((cert) => (
              <Badge key={cert} variant="secondary" className="text-sm py-2 px-4">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {cert}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">A Nossa Gama</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-left">
          {[
            {
              name: "CARA SOFT",
              desc: "Rugas finas e superficiais",
              size: "100-200 μm",
            },
            {
              name: "CARA MILD",
              desc: "Correção moderada",
              size: "200-300 μm",
            },
            {
              name: "CARA HARD",
              desc: "Rugas profundas e contorno",
              size: "300-400 μm",
            },
            {
              name: "CARA ULTRA",
              desc: "Volumização e estrutura",
              size: "400-500 μm",
            },
          ].map((product) => (
            <Card key={product.name}>
              <CardContent className="p-4">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.desc}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Partícula: {product.size}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
