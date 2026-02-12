import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ContactPage() {
  const { toast } = useToast();
  const { t } = useLanguage();

  const contactSchema = z.object({
    name: z.string().min(2, t("contactPage.validation.nameRequired")),
    email: z.string().email(t("contactPage.validation.emailInvalid")),
    phone: z.string().optional(),
    subject: z.string().min(2, t("contactPage.validation.subjectRequired")),
    message: z.string().min(10, t("contactPage.validation.messageMin")),
  });

  type ContactFormData = z.infer<typeof contactSchema>;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: t("contactPage.toast.successTitle"),
        description: t("contactPage.toast.successDesc"),
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: t("contactPage.toast.errorTitle"),
        description: t("contactPage.toast.errorDesc"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  const contactInfo = [
    {
      icon: Mail,
      label: t("contactPage.info.email"),
      value: "info@cara-portugal.pt",
      href: "mailto:info@cara-portugal.pt",
    },
    {
      icon: Phone,
      label: t("contactPage.info.phone"),
      value: "+351 21 000 0000",
      href: "tel:+351210000000",
    },
    {
      icon: MapPin,
      label: t("contactPage.info.address"),
      value: "Lisboa, Portugal",
      href: null,
    },
    {
      icon: Clock,
      label: t("contactPage.info.hours"),
      value: "Seg-Sex: 9h-18h",
      href: null,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-contact-title">
          {t("contactPage.title")}
        </h1>
        <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
          {t("contactPage.subtitle")}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("contactPage.info.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="font-medium hover:text-primary transition-colors"
                        data-testid={`link-${item.label.toLowerCase()}`}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-medium">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">{t("contactPage.professional.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("contactPage.professional.description")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("contactPage.form.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contactPage.form.name")}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-contact-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contactPage.form.email")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-contact-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contactPage.form.phone")}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-contact-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("contactPage.form.subject")}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-contact-subject" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("contactPage.form.message")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={5}
                            data-testid="input-contact-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitMutation.isPending}
                    data-testid="button-submit-contact"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitMutation.isPending ? t("contactPage.form.submitting") : t("contactPage.form.submit")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
