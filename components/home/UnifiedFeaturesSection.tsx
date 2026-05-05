import {
  BarChart3,
  CalendarCheck,
  Globe,
  Headphones,
  Lock,
  MapPin,
  Receipt,
  Settings,
  Shield,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

type UnifiedFeaturesSectionProps = {
  locale: string;
};

type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

function getCopy(locale: string) {
  if (locale === "es") {
    return {
      eyebrow: "Plataforma de funciones",
      title: "Todo en una sola vista",
      description:
        "Combinamos los beneficios clave en un bloque claro para mostrar valor real sin exponer detalles internos sensibles.",
    };
  }

  if (locale === "nl") {
    return {
      eyebrow: "Functieplatform",
      title: "Alles in een overzicht",
      description:
        "We combineren de belangrijkste voordelen in een duidelijke sectie zodat de waarde zichtbaar is zonder gevoelige interne details prijs te geven.",
    };
  }

  return {
    eyebrow: "Feature platform",
    title: "Everything in one clear view",
    description:
      "We combine the key benefits into one section so visitors see real value without exposing sensitive internal implementation details.",
  };
}

function getFeatures(locale: string): FeatureItem[] {
  if (locale === "es") {
    return [
      {
        icon: Globe,
        title: "Reservas online 24/7",
        description: "Acepta solicitudes en cualquier momento con una experiencia de reserva profesional.",
      },
      {
        icon: CalendarCheck,
        title: "Disponibilidad protegida",
        description: "Reglas operativas evitan conflictos y mantienen la agenda bajo control.",
      },
      {
        icon: MapPin,
        title: "Operación de entrega y devolución",
        description: "Seguimiento claro para handoff, ubicación y estado operativo diario.",
      },
      {
        icon: Receipt,
        title: "Facturación lista",
        description: "Documentos y cobros alineados para mantener la operación financiera ordenada.",
      },
      {
        icon: Smartphone,
        title: "Experiencia móvil",
        description: "Flujos optimizados para clientes y equipo en móvil y escritorio.",
      },
      {
        icon: Shield,
        title: "Controles de seguridad",
        description: "Protecciones clave reducen errores comunes y riesgos operativos.",
      },
      {
        icon: Lock,
        title: "Ventaja interna privada",
        description: "El valor se comunica hacia fuera sin revelar la lógica interna del negocio.",
      },
      {
        icon: Settings,
        title: "Escalabilidad preparada",
        description: "Base flexible para crecer con nuevas reglas, servicios y automatizaciones.",
      },
      {
        icon: BarChart3,
        title: "Visibilidad de gestión",
        description: "Indicadores útiles para tomar decisiones más rápidas y con contexto.",
      },
      {
        icon: Headphones,
        title: "Soporte de operación",
        description: "Diseñado para trabajar con procesos reales de alquiler y equipos activos.",
      },
    ];
  }

  if (locale === "nl") {
    return [
      {
        icon: Globe,
        title: "24/7 online boekingen",
        description: "Accepteer aanvragen op elk moment via een professionele boekingservaring.",
      },
      {
        icon: CalendarCheck,
        title: "Beschikbaarheid beschermd",
        description: "Operationele regels voorkomen conflicten en houden planning stabiel.",
      },
      {
        icon: MapPin,
        title: "Pickup- en return-operatie",
        description: "Heldere opvolging van overdracht, locatie en dagelijkse operationele status.",
      },
      {
        icon: Receipt,
        title: "Facturatieklaar",
        description: "Documenten en betalingen blijven afgestemd voor een nette financiële flow.",
      },
      {
        icon: Smartphone,
        title: "Mobiele ervaring",
        description: "Geoptimaliseerde flows voor klanten en team op mobiel en desktop.",
      },
      {
        icon: Shield,
        title: "Veiligheidscontroles",
        description: "Belangrijke beschermingen verminderen veelvoorkomende operationele fouten.",
      },
      {
        icon: Lock,
        title: "Interne voorsprong blijft privé",
        description: "Waarde wordt extern getoond zonder interne bedrijfslogica prijs te geven.",
      },
      {
        icon: Settings,
        title: "Klaar om op te schalen",
        description: "Flexibele basis om te groeien met nieuwe regels, services en automatiseringen.",
      },
      {
        icon: BarChart3,
        title: "Managementinzichten",
        description: "Nuttige signalen voor snellere en beter onderbouwde beslissingen.",
      },
      {
        icon: Headphones,
        title: "Operationele ondersteuning",
        description: "Ontworpen voor echte verhuurprocessen en actieve teams.",
      },
    ];
  }

  return [
    {
      icon: Globe,
      title: "24/7 online bookings",
      description: "Capture requests anytime through a professional booking experience.",
    },
    {
      icon: CalendarCheck,
      title: "Protected availability",
      description: "Operational rules reduce conflicts and keep scheduling stable.",
    },
    {
      icon: MapPin,
      title: "Pickup and return operations",
      description: "Clear tracking for handoff, location, and daily operational status.",
    },
    {
      icon: Receipt,
      title: "Billing-ready workflows",
      description: "Documents and payments stay aligned for cleaner financial operations.",
    },
    {
      icon: Smartphone,
      title: "Mobile-first experience",
      description: "Optimized flows for both customers and team members across devices.",
    },
    {
      icon: Shield,
      title: "Operational safeguards",
      description: "Key protections reduce common mistakes and day-to-day risk.",
    },
    {
      icon: Lock,
      title: "Private internal edge",
      description: "Public messaging shows value without exposing internal business logic.",
    },
    {
      icon: Settings,
      title: "Built to scale",
      description: "A flexible foundation for new rules, services, and automations.",
    },
    {
      icon: BarChart3,
      title: "Management visibility",
      description: "Useful signals help teams make faster, clearer decisions.",
    },
    {
      icon: Headphones,
      title: "Operations-focused support",
      description: "Designed around real rental workflows and active teams.",
    },
  ];
}

export function UnifiedFeaturesSection({ locale }: UnifiedFeaturesSectionProps) {
  const copy = getCopy(locale);
  const items = getFeatures(locale);

  return (
    <section id="platform-overview" className="border-y border-[#d8e4f2] bg-[#f6f9fe] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#2f6fed]">{copy.eyebrow}</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-[#0f2745] sm:text-5xl">{copy.title}</h2>
          <p className="mt-5 text-lg leading-relaxed text-[#5a7089]">{copy.description}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-[#d8e4f2] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#a9c4ef] hover:shadow-[0_18px_40px_-26px_rgba(15,39,69,0.18)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf1ff] text-[#2f6fed] transition-colors group-hover:bg-[#2f6fed] group-hover:text-white">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#0f2745]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5a7089]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
