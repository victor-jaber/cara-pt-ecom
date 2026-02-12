import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Award,
  Beaker,
  Building2,
  CheckCircle2
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Beaker,
      title: t("about.features.technology.title"),
      description: t("about.features.technology.description"),
    },
    {
      icon: Shield,
      title: t("about.features.safety.title"),
      description: t("about.features.safety.description"),
    },
    {
      icon: Award,
      title: t("about.features.quality.title"),
      description: t("about.features.quality.description"),
    },
    {
      icon: Building2,
      title: t("about.features.support.title"),
      description: t("about.features.support.description"),
    },
  ];

  const certifications = [
    t("about.certifications.items.infarmed"),
    t("about.certifications.items.ce"),
    t("about.certifications.items.kgmp"),
    t("about.certifications.items.iso13485"),
    t("about.certifications.items.iso22716"),
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-about-title">
          {t("about.title")}
        </h1>
        <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
          {t("about.subtitle")}
        </p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <p>
          {t("about.intro1")}
        </p>
        <p>
          {t("about.intro2")}
        </p>
        <p>
          {t("about.intro3")}
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
          <h2 className="text-2xl font-bold mb-6 text-center">{t("about.certifications.title")}</h2>
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
        <h2 className="text-2xl font-bold mb-4">{t("about.range.title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-left">
          {[
            {
              name: t("about.range.soft.name"),
              desc: t("about.range.soft.description"),
              size: t("about.range.soft.size"),
            },
            {
              name: t("about.range.mild.name"),
              desc: t("about.range.mild.description"),
              size: t("about.range.mild.size"),
            },
            {
              name: t("about.range.hard.name"),
              desc: t("about.range.hard.description"),
              size: t("about.range.hard.size"),
            },
            {
              name: t("about.range.ultra.name"),
              desc: t("about.range.ultra.description"),
              size: t("about.range.ultra.size"),
            },
          ].map((product) => (
            <Card key={product.name}>
              <CardContent className="p-4">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.desc}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("about.range.particle")} {product.size}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
