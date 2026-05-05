"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Globe,
  Maximize2,
  Minimize2,
  Receipt,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

type SalesPresentationProps = {
  locale: string;
  tenantName: string;
  whatsappUrl?: string;
  email: string;
};

type ComparisonRow = {
  label: string;
  before: number;
  after: number;
};

type PeriodNetRow = {
  period: string;
  laborCost: number;
  appCost: number;
  net: number;
};

type WageMarket = {
  id: "aruba" | "curacao" | "bonaire";
  label: string;
  hourlyWageUsdEstimate: number;
  displayRate: string;
  effectiveDate: string;
  sourceLabel: string;
  estimateNote: string;
};

const APP_SIGNUP_COST = 500;
const APP_MONTHLY_COST = 100;
const BASE_HOURLY_MIN_WAGE_USD = 11.5;
const EMPLOYER_BURDEN_FACTOR = 1.25;
const WORKING_DAYS_PER_MONTH = 22;
const WORKING_DAYS_PER_WEEK = 5;
const MONTHS_PER_YEAR = 12;

const WAGE_MARKETS: WageMarket[] = [
  {
    id: "aruba",
    label: "Aruba",
    hourlyWageUsdEstimate: 6.47,
    displayRate: "AWG 11.58/hr",
    effectiveDate: "Jan 1, 2025",
    sourceLabel: "WageIndicator (Aruba)",
    estimateNote: "USD estimate uses AWG/USD peg assumption (~1.79).",
  },
  {
    id: "curacao",
    label: "Curaçao",
    hourlyWageUsdEstimate: 6.67,
    displayRate: "XCG 11.93/hr (21+)",
    effectiveDate: "Jan 1, 2025",
    sourceLabel: "WageIndicator (Curaçao)",
    estimateNote: "USD estimate uses XCG/USD peg assumption (~1.79).",
  },
  {
    id: "bonaire",
    label: "Bonaire",
    hourlyWageUsdEstimate: BASE_HOURLY_MIN_WAGE_USD,
    displayRate: "USD 11.50/hr",
    effectiveDate: "Assumption for deck",
    sourceLabel: "Working assumption (official page parsing unavailable)",
    estimateNote: "Treat as estimate/assumption until confirmed with latest official BES publication.",
  },
];

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : locale === "nl" ? "nl-NL" : "en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : locale === "nl" ? "nl-NL" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function ComparisonBars({
  rows,
  locale,
  beforeLabel,
  afterLabel,
  money = false,
}: {
  rows: ComparisonRow[];
  locale: string;
  beforeLabel: string;
  afterLabel: string;
  money?: boolean;
}) {
  const maxValue = Math.max(...rows.flatMap((row) => [row.before, row.after]), 1);

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const beforeWidth = `${Math.max((row.before / maxValue) * 100, 6)}%`;
        const afterWidth = `${Math.max((row.after / maxValue) * 100, 6)}%`;
        const beforeValue = money ? formatMoney(row.before, locale) : String(row.before);
        const afterValue = money ? formatMoney(row.after, locale) : String(row.after);

        return (
          <div key={row.label} className="rounded-xl border border-[#d8e4f2] bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-[#234568]">{row.label}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-[#6b819a]">{beforeLabel}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef3fb]">
                  <div className="h-full rounded-full bg-[#9aaec7]" style={{ width: beforeWidth }} />
                </div>
                <span className="w-24 text-right text-xs font-semibold text-[#4b637d]">{beforeValue}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-xs font-medium text-[#2f6fed]">{afterLabel}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eaf1ff]">
                  <div className="h-full rounded-full bg-[#2f6fed]" style={{ width: afterWidth }} />
                </div>
                <span className="w-24 text-right text-xs font-semibold text-[#2f6fed]">{afterValue}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScenarioNetTable({
  locale,
  rows,
  labels,
}: {
  locale: string;
  rows: PeriodNetRow[];
  labels: {
    period: string;
    laborCost: string;
    appCost: string;
    netResult: string;
    savings: string;
    loss: string;
  };
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#d8e4f2] bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-[#f8fbff] text-left text-[#4b637d]">
          <tr>
            <th className="px-4 py-3 font-semibold">{labels.period}</th>
            <th className="px-4 py-3 font-semibold">{labels.laborCost}</th>
            <th className="px-4 py-3 font-semibold">{labels.appCost}</th>
            <th className="px-4 py-3 font-semibold">{labels.netResult}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.period} className="border-t border-[#e6eef8] text-[#234568]">
              <td className="px-4 py-3 font-medium">{row.period}</td>
              <td className="px-4 py-3">{formatMoney(row.laborCost, locale)}</td>
              <td className="px-4 py-3">{formatMoney(row.appCost, locale)}</td>
              <td className="px-4 py-3 font-semibold">
                <span className={row.net >= 0 ? "text-[#136a34]" : "text-[#b42318]"}>
                  {formatMoney(row.net, locale)} ({row.net >= 0 ? labels.savings : labels.loss})
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildScenarioRows(laborDailyEquivalent: number): PeriodNetRow[] {
  const appDaily = APP_MONTHLY_COST / WORKING_DAYS_PER_MONTH;
  const appWeekly = appDaily * WORKING_DAYS_PER_WEEK;
  const laborWeekly = laborDailyEquivalent * WORKING_DAYS_PER_WEEK;
  const laborMonthly = laborDailyEquivalent * WORKING_DAYS_PER_MONTH;
  const laborYearly = laborMonthly * MONTHS_PER_YEAR;

  return [
    {
      period: "Day",
      laborCost: laborDailyEquivalent,
      appCost: appDaily,
      net: laborDailyEquivalent - appDaily,
    },
    {
      period: "Week",
      laborCost: laborWeekly,
      appCost: appWeekly,
      net: laborWeekly - appWeekly,
    },
    {
      period: "Month",
      laborCost: laborMonthly,
      appCost: APP_MONTHLY_COST,
      net: laborMonthly - APP_MONTHLY_COST,
    },
    {
      period: "Year",
      laborCost: laborYearly,
      appCost: APP_SIGNUP_COST + APP_MONTHLY_COST * MONTHS_PER_YEAR,
      net: laborYearly - (APP_SIGNUP_COST + APP_MONTHLY_COST * MONTHS_PER_YEAR),
    },
  ];
}

function getCopy(locale: string, tenantName: string) {
  if (locale === "es") {
    return {
      kicker: "Presentación comercial",
      title: "Voy a mostrar cómo fortalecer la operación de alquiler",
      subtitle:
        `En esta presentación explico cómo ${tenantName} centraliza reservas, flota y cobros para mejorar conversión sin exponer detalles internos sensibles.`,
      problemTitle: "Problema actual",
      problemPoints: [
        "Demasiadas tareas manuales consumen tiempo operativo",
        "Errores de coordinación impactan experiencia y margen",
        "La venta no siempre comunica el valor completo de la operación",
      ],
      capabilitiesTitle: "Capacidades clave (resumen comercial)",
      capabilities: [
        "Reserva online y disponibilidad protegida",
        "Gestión de pickup/return con visibilidad operativa",
        "Facturación lista para procesos profesionales",
        "Gestión de mantenimiento, seguimiento de seguros y control de inspecciones",
        "Base escalable para nuevas reglas y servicios",
      ],
      businessContextTitle: "Cómo mejora la gestión diaria",
      businessContextPoints: [
        "Tu equipo deja de perseguir mensajes y hojas sueltas, porque la operación vive en un flujo único y claro.",
        "La coordinación entre reservas, entregas y devoluciones se vuelve más predecible, reduciendo horas de corrección.",
        "Con mejor trazabilidad, puedes detectar cuellos de botella antes de que afecten ingresos o experiencia del cliente.",
        "La dirección gana visibilidad real para decidir precios, capacidad y prioridades semanales con más confianza.",
      ],
      scaleTitle: "Ejemplo agresivo de escala (sin contratar más personal)",
      scaleBody:
        "Con el mismo equipo operativo, el objetivo es absorber más tareas y reservas diarias sin añadir otro coordinador en nómina.",
      capacityRows: [
        { label: "Tareas operativas por día (mismo equipo)", before: 54, after: 90 },
        { label: "Reservas gestionadas por día", before: 18, after: 30 },
      ],
      financeTitle: "Impacto financiero directo (escenario de referencia)",
      financeBody:
        "Comparación directa entre costo laboral evitado y costo real de la app ($500 alta + $100/mes).",
      minimumWageAssumption:
        "Supuesto: salario mínimo $11.50/h x 8h + 25% cargas = $115/día por empleado adicional.",
      financeCalculationTitle: "Reglas de cálculo usadas",
      financeCalculationLines: [
        "Costo de app obligatorio: $500 único (siempre) + $100/mes.",
        "Conversión de periodos: 22 días operativos/mes, 5 días operativos/semana, 12 meses/año.",
      ],
      financeWorkingDaysNote: "Resultado neto = costo laboral evitado - costo de la app (Ahorro o Pérdida).",
      wageAssumptionsTitle: "Salarios mínimos usados (estimación/supuesto)",
      wageAssumptionsNote: "Estas tarifas se usan solo para estimar costos en esta presentación.",
      selectMarketLabel: "Mercado",
      mandatorySetupNote: "Cargo obligatorio en ambos escenarios: setup único de $500 (mes 1).",
      scenarioOneTitle: "Escenario A: contratar 1 empleado adicional (8h/día, 5 días/semana)",
      scenarioOneDetails:
        "Costo laboral diario con carga patronal: tarifa por hora x 8h x 1.25.",
      scenarioTwoTitle: "Escenario B: contratar 2 veces/semana, 4h por día",
      scenarioTwoDetails:
        "Calculadora en vivo (sin cargas/AOV): define horas por día y días por semana para obtener el costo laboral evitado.",
      scenarioBHoursLabel: "Horas por día",
      scenarioBDaysLabel: "Días por semana",
      scenarioBFormulaLabel: "Fórmula",
      scenarioBFormulaNote: "Sin cargas patronales: salario base por hora x horas/día x días/semana.",
      firstMonthLabel: "Neto del primer mes (setup obligatorio de $500 + $100/mes)",
      periodLabel: "Periodo",
      laborCostLabel: "Costo laboral evitado",
      appCostLabel: "Costo app",
      netResultLabel: "Resultado neto",
      savingsResultLabel: "Ahorro",
      lossResultLabel: "Pérdida",
      firstYearSummaryLabel: "Resumen primer año",
      beforeLabel: "Antes",
      afterLabel: "Después",
      savingsLabel: "Ahorro estimado",
      perYearLabel: "por año",
      outcomesTitle: "Resultados que buscan los operadores",
      outcomes: [
        "Más reservas confirmadas con menos fricción",
        "Menos errores manuales en entregas y devoluciones",
        "Mejor control de pagos y facturación",
        "Mayor claridad para tomar decisiones semanales",
      ],
      whyTitle: "Por qué esto vende mejor",
      whyBody:
        "Tu equipo puede mostrar valor profesional al cliente sin exponer reglas internas ni procesos sensibles.",
      rolloutTitle: "Implementación orientada a negocio",
      rolloutSteps: [
        "Evaluación rápida de operación y prioridades",
        "Configuración de flujo y marca",
        "Capacitación corta para operación diaria",
        "Arranque con seguimiento inicial",
      ],
      ctaPrimary: "Solicitar demo ejecutiva",
      ctaSecondary: "Contactar por email",
      nextLabel: "Siguiente",
      prevLabel: "Anterior",
      slideLabel: "Diapositiva",
      fullscreenEnter: "Pantalla completa",
      fullscreenExit: "Salir de pantalla completa",
      notes: [
        "Diseño pensado para equipos de alquiler activos",
        "Preparado para crecimiento y nuevas reglas",
      ],
    };
  }

  if (locale === "nl") {
    return {
      kicker: "Commerciële presentatie",
      title: "Ik laat zien hoe je verhuuroperatie sterker wordt",
      subtitle:
        `In deze presentatie leg ik uit hoe ${tenantName} boekingen, vloot en facturatie centraliseert om conversie te verbeteren zonder gevoelige interne details te tonen.`,
      problemTitle: "Huidige uitdaging",
      problemPoints: [
        "Te veel handmatig werk kost operationele tijd",
        "Coördinatiefouten raken klantbeleving en marge",
        "Sales vertelt niet altijd de volledige operationele waarde",
      ],
      capabilitiesTitle: "Kerncapaciteiten (sales-overzicht)",
      capabilities: [
        "Online boeken met beschermde beschikbaarheid",
        "Pickup/return-beheer met operationele zichtbaarheid",
        "Facturatie klaar voor professionele processen",
        "Onderhoudsbeheer, verzekeringsopvolging en inspectietracking",
        "Schaalbare basis voor nieuwe regels en services",
      ],
      businessContextTitle: "Hoe dit dagelijks beheer verbetert",
      businessContextPoints: [
        "Je team hoeft minder te schakelen tussen losse berichten en spreadsheets, omdat de operatie in één heldere flow zit.",
        "Afstemming tussen boekingen, pickup en return wordt voorspelbaarder, met minder correctiewerk.",
        "Met betere traceerbaarheid zie je knelpunten eerder, voordat omzet of klantbeleving geraakt wordt.",
        "Management krijgt bruikbare zichtbaarheid om prijzen, capaciteit en wekelijkse prioriteiten zekerder te sturen.",
      ],
      scaleTitle: "Agressief schaalvoorbeeld (zonder extra personeel)",
      scaleBody:
        "Met hetzelfde operationele team is het doel om meer dagelijkse taken en boekingen op te vangen zonder een extra coördinator op de loonlijst.",
      capacityRows: [
        { label: "Operationele taken per dag (zelfde team)", before: 54, after: 90 },
        { label: "Boekingen verwerkt per dag", before: 18, after: 30 },
      ],
      financeTitle: "Direct financieel effect (referentiescenario)",
      financeBody:
        "Rechtstreekse vergelijking tussen vermeden loonkost en de echte app-kost ($500 opstart + $100/maand).",
      minimumWageAssumption:
        "Aanname: minimumloon $11.50/u x 8u + 25% werkgeverslasten = $115/dag per extra medewerker.",
      financeCalculationTitle: "Gebruikte rekenregels",
      financeCalculationLines: [
        "Verplichte app-kost: eenmalig $500 (altijd) + $100/maand.",
        "Periode-omrekening: 22 operationele dagen/maand, 5 operationele dagen/week, 12 maanden/jaar.",
      ],
      financeWorkingDaysNote: "Nettoresultaat = vermeden loonkost - app-kost (Besparing of Verlies).",
      wageAssumptionsTitle: "Gebruikte minimumlonen (schatting/aanname)",
      wageAssumptionsNote: "Deze tarieven worden alleen gebruikt als kosteninschatting in deze presentatie.",
      selectMarketLabel: "Markt",
      mandatorySetupNote: "Verplichte kost in beide scenario's: eenmalige setup van $500 (maand 1).",
      scenarioOneTitle: "Scenario A: 1 extra medewerker aannemen (8u/dag, 5 dagen/week)",
      scenarioOneDetails:
        "Dagelijkse loonkost met werkgeverslast: uurtarief x 8u x 1.25.",
      scenarioTwoTitle: "Scenario B: 2 keer/week aannemen, 4u per dag",
      scenarioTwoDetails:
        "Live calculator (zonder werkgeverslasten): bepaal uren per dag en dagen per week om vermeden loonkost te berekenen.",
      scenarioBHoursLabel: "Uren per dag",
      scenarioBDaysLabel: "Dagen per week",
      scenarioBFormulaLabel: "Formule",
      scenarioBFormulaNote: "Zonder werkgeverslasten: basis uurloon x uren/dag x dagen/week.",
      firstMonthLabel: "Netto eerste maand (verplichte $500 setup + $100/maand)",
      periodLabel: "Periode",
      laborCostLabel: "Vermeden loonkost",
      appCostLabel: "App-kost",
      netResultLabel: "Nettoresultaat",
      savingsResultLabel: "Besparing",
      lossResultLabel: "Verlies",
      firstYearSummaryLabel: "Samenvatting eerste jaar",
      beforeLabel: "Voor",
      afterLabel: "Na",
      savingsLabel: "Geschatte besparing",
      perYearLabel: "per jaar",
      outcomesTitle: "Resultaten die operators willen",
      outcomes: [
        "Meer bevestigde boekingen met minder frictie",
        "Minder handmatige fouten bij pickup en return",
        "Strakkere controle op betalingen en facturatie",
        "Duidelijkere inzichten voor wekelijkse beslissingen",
      ],
      whyTitle: "Waarom dit beter verkoopt",
      whyBody:
        "Je team laat professionele waarde zien zonder gevoelige interne regels en processen prijs te geven.",
      rolloutTitle: "Businessgerichte implementatie",
      rolloutSteps: [
        "Snelle evaluatie van operatie en prioriteiten",
        "Instellen van flow en branding",
        "Korte training voor dagelijks gebruik",
        "Livegang met initiële opvolging",
      ],
      ctaPrimary: "Plan een executive demo",
      ctaSecondary: "Contact via e-mail",
      nextLabel: "Volgende",
      prevLabel: "Vorige",
      slideLabel: "Slide",
      fullscreenEnter: "Volledig scherm",
      fullscreenExit: "Volledig scherm afsluiten",
      notes: [
        "Ontworpen voor actieve verhuurteams",
        "Klaar voor groei en nieuwe regels",
      ],
    };
  }

  return {
    kicker: "Sales presentation",
    title: "I will show how to scale your rental operations",
    subtitle:
      `In this presentation, I walk through how ${tenantName} centralizes bookings, fleet workflow, and billing to improve conversion without exposing sensitive internal details.`,
    problemTitle: "Current challenge",
    problemPoints: [
      "Too many manual steps consume operational time",
      "Coordination errors hurt customer experience and margins",
      "Sales messaging often misses the full operational value",
    ],
    capabilitiesTitle: "Key capabilities (sales summary)",
    capabilities: [
      "Online booking with protected availability",
      "Pickup/return management with clear operational visibility",
      "Billing-ready workflows for professional operations",
      "Maintenance management, insurance tracking, and inspection tracking",
      "Scalable foundation for new rules and services",
    ],
    businessContextTitle: "How this improves day-to-day operations",
    businessContextPoints: [
      "Your team spends less time juggling chats and spreadsheets because core operations are handled in one consistent flow.",
      "Coordination between booking, pickup, and return becomes predictable, reducing rework and avoidable delays.",
      "Better traceability helps you catch bottlenecks early before they hurt revenue or customer trust.",
      "Leadership gets clearer visibility to make faster decisions on pricing, capacity, and weekly priorities.",
    ],
    scaleTitle: "Aggressive scaling example (without adding headcount)",
    scaleBody:
      "With the same operations team, the goal is to absorb more daily tasks and bookings without adding another coordinator to payroll.",
    capacityRows: [
      { label: "Operational tasks per day (same team)", before: 54, after: 90 },
      { label: "Bookings handled per day", before: 18, after: 30 },
    ],
    financeTitle: "Direct financial impact (reference scenario)",
    financeBody:
      "Direct comparison between avoided labor cost and real app pricing ($500 setup + $100/month).",
    minimumWageAssumption:
      "Assumption: minimum wage $11.50/hr x 8h + 25% employer burden = $115/day per additional employee.",
    financeCalculationTitle: "Rules used in calculation",
    financeCalculationLines: [
      "Mandatory app cost: one-time $500 setup (always) + $100/month.",
      "Period conversion: 22 operating days/month, 5 operating days/week, 12 months/year.",
    ],
    financeWorkingDaysNote: "Net result = avoided labor cost - app cost (Savings or Loss).",
    wageAssumptionsTitle: "Minimum wage assumptions used (estimate/assumption)",
    wageAssumptionsNote: "These rates are used as estimates for presentation modeling.",
    selectMarketLabel: "Market",
    mandatorySetupNote: "Mandatory in both scenarios: one-time $500 setup fee (month 1).",
    scenarioOneTitle: "Scenario A: hire 1 additional employee (8h/day, 5 days/week)",
    scenarioOneDetails:
      "Daily labor cost with employer burden: hourly wage x 8h x 1.25.",
    scenarioTwoTitle: "Scenario B: hire 2 times/week, 4h per day",
    scenarioTwoDetails:
      "Live calculator (without employer burden): set hours per day and days per week to compute avoided labor cost.",
    scenarioBHoursLabel: "Hours per day",
    scenarioBDaysLabel: "Days per week",
    scenarioBFormulaLabel: "Formula",
    scenarioBFormulaNote: "No employer burden: base hourly wage x hours/day x days/week.",
    firstMonthLabel: "First-month net (mandatory $500 setup + $100/month)",
    periodLabel: "Period",
    laborCostLabel: "Avoided labor cost",
    appCostLabel: "App cost",
    netResultLabel: "Net result",
    savingsResultLabel: "Savings",
    lossResultLabel: "Loss",
    firstYearSummaryLabel: "First-year summary",
    beforeLabel: "Before",
    afterLabel: "After",
    savingsLabel: "Estimated savings",
    perYearLabel: "per year",
    outcomesTitle: "Operator-focused outcomes",
    outcomes: [
      "More confirmed bookings with less friction",
      "Fewer manual errors across pickup and return",
      "Tighter billing and payment control",
      "Clearer visibility for weekly decision-making",
    ],
    whyTitle: "Why this sells better",
    whyBody:
      "Your team can communicate professional value publicly without exposing sensitive internal rules and implementation details.",
    rolloutTitle: "Business-first rollout",
    rolloutSteps: [
      "Fast assessment of current operations and priorities",
      "Flow and brand configuration",
      "Short enablement for daily use",
      "Go-live with early operational follow-up",
    ],
    ctaPrimary: "Request executive demo",
    ctaSecondary: "Contact by email",
    nextLabel: "Next",
    prevLabel: "Previous",
    slideLabel: "Slide",
    fullscreenEnter: "Full screen",
    fullscreenExit: "Exit full screen",
    notes: [
      "Designed for active rental operations",
      "Ready to grow with new rules and services",
    ],
  };
}

export function SalesPresentation({ locale, tenantName, whatsappUrl, email }: SalesPresentationProps) {
  const copy = getCopy(locale, tenantName);
  const [slide, setSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMarketId, setSelectedMarketId] = useState<WageMarket["id"]>("bonaire");
  const [scenarioBHoursPerDay, setScenarioBHoursPerDay] = useState(4);
  const [scenarioBDaysPerWeek, setScenarioBDaysPerWeek] = useState(2);

  const selectedMarket = useMemo(
    () => WAGE_MARKETS.find((market) => market.id === selectedMarketId) ?? WAGE_MARKETS[2],
    [selectedMarketId]
  );

  const selectedHourlyWageUsd = useMemo(() => selectedMarket.hourlyWageUsdEstimate, [selectedMarket]);

  const scenarioAFullTimeDailyLaborCost = useMemo(
    () => selectedHourlyWageUsd * 8 * EMPLOYER_BURDEN_FACTOR,
    [selectedHourlyWageUsd]
  );

  const scenarioBWorkedDayCost = useMemo(() => selectedHourlyWageUsd * scenarioBHoursPerDay, [scenarioBHoursPerDay, selectedHourlyWageUsd]);
  const scenarioBWeeklyLaborCost = useMemo(
    () => scenarioBWorkedDayCost * scenarioBDaysPerWeek,
    [scenarioBDaysPerWeek, scenarioBWorkedDayCost]
  );

  const fullTimeRows = useMemo(() => buildScenarioRows(scenarioAFullTimeDailyLaborCost), [scenarioAFullTimeDailyLaborCost]);
  const partTimeRows = useMemo(() => {
    const dailyOperatingAverage = scenarioBWeeklyLaborCost / WORKING_DAYS_PER_WEEK;
    return buildScenarioRows(dailyOperatingAverage);
  }, [scenarioBWeeklyLaborCost]);
  const fullTimeFirstMonthNet = useMemo(
    () => scenarioAFullTimeDailyLaborCost * WORKING_DAYS_PER_MONTH - (APP_SIGNUP_COST + APP_MONTHLY_COST),
    [scenarioAFullTimeDailyLaborCost]
  );
  const partTimeFirstMonthNet = useMemo(() => {
    const monthlyLaborCost = scenarioBWeeklyLaborCost * (WORKING_DAYS_PER_MONTH / WORKING_DAYS_PER_WEEK);
    return monthlyLaborCost - (APP_SIGNUP_COST + APP_MONTHLY_COST);
  }, [scenarioBWeeklyLaborCost]);

  const slides = useMemo(
    () => [
      {
        id: "intro",
        content: (
          <div className="relative overflow-hidden rounded-2xl border border-[#d8e4f2] bg-[linear-gradient(180deg,#f8fbff_0%,#eef5fc_100%)] p-8 sm:p-10">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#2f6fed]/12 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[#7eb3ff]/12 blur-3xl" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#d8e4f2] bg-white px-4 py-2 text-sm font-semibold text-[#2f6fed]">
                <Sparkles className="h-4 w-4" />
                {copy.kicker}
              </p>
              <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#5a7089]">{copy.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {copy.notes.map((note) => (
                  <span
                    key={note}
                    className="rounded-full border border-[#d8e4f2] bg-white px-4 py-2 text-sm font-medium text-[#2f6fed]"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "problem",
        content: (
          <div className="rounded-2xl border border-[#d8e4f2] bg-white p-8 shadow-[0_20px_50px_-30px_rgba(15,39,69,0.2)]">
            <h2 className="text-3xl font-bold tracking-tight">{copy.problemTitle}</h2>
            <div className="mt-6 space-y-4">
              {copy.problemPoints.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f6ff] text-[#2f6fed]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <p className="text-lg leading-relaxed text-[#4b637d]">{point}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "capabilities",
        content: (
          <div className="rounded-2xl border border-[#d8e4f2] bg-[#f8fbff] p-8 shadow-[0_20px_50px_-30px_rgba(15,39,69,0.2)]">
            <h2 className="text-3xl font-bold tracking-tight">{copy.capabilitiesTitle}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {copy.capabilities.map((item) => (
                <div key={item} className="rounded-xl border border-[#d8e4f2] bg-white p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eaf1ff] text-[#2f6fed]">
                      <Globe className="h-4 w-4" />
                    </span>
                    <p className="text-base leading-relaxed text-[#4b637d]">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "business-context",
        content: (
          <div className="rounded-2xl border border-[#d8e4f2] bg-white p-8 shadow-[0_20px_50px_-30px_rgba(15,39,69,0.2)]">
            <h2 className="text-3xl font-bold tracking-tight">{copy.businessContextTitle}</h2>
            <div className="mt-6 space-y-4">
              {copy.businessContextPoints.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f0f6ff] text-[#2f6fed]">
                    <CalendarCheck className="h-4 w-4" />
                  </span>
                  <p className="text-lg leading-relaxed text-[#4b637d]">{point}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: "scale-example",
        content: (
          <div className="rounded-2xl border border-[#d8e4f2] bg-[#f8fbff] p-8 shadow-[0_20px_50px_-30px_rgba(15,39,69,0.2)]">
            <h2 className="text-3xl font-bold tracking-tight">{copy.scaleTitle}</h2>
            <p className="mt-4 text-base leading-relaxed text-[#5a7089]">{copy.scaleBody}</p>
            <div className="mt-6">
              <ComparisonBars
                rows={copy.capacityRows}
                locale={locale}
                beforeLabel={copy.beforeLabel}
                afterLabel={copy.afterLabel}
              />
            </div>
          </div>
        ),
      },
      {
        id: "finance-graph",
        content: (
          <div className="rounded-2xl border border-[#d8e4f2] bg-white p-8 shadow-[0_20px_50px_-30px_rgba(15,39,69,0.2)]">
            <h2 className="text-3xl font-bold tracking-tight">{copy.financeTitle}</h2>
            <p className="mt-4 text-base leading-relaxed text-[#5a7089]">{copy.financeBody}</p>
            <p className="mt-2 text-sm font-medium text-[#2f6fed]">{copy.minimumWageAssumption}</p>

            <div className="mt-4 rounded-xl border border-[#d8e4f2] bg-[#f8fbff] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#234568]">{copy.wageAssumptionsTitle}</p>
                <label className="text-xs font-semibold text-[#234568]">
                  {copy.selectMarketLabel}
                  <select
                    value={selectedMarketId}
                    onChange={(event) => setSelectedMarketId(event.target.value as WageMarket["id"])}
                    className="ml-2 h-8 rounded-lg border border-[#c8d8eb] bg-white px-2 text-xs font-medium text-[#183b67]"
                  >
                    {WAGE_MARKETS.map((market) => (
                      <option key={market.id} value={market.id}>
                        {market.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {WAGE_MARKETS.map((market) => (
                  <div key={market.id} className={`rounded-lg border p-3 ${market.id === selectedMarketId ? "border-[#2f6fed] bg-[#eef4ff]" : "border-[#d8e4f2] bg-white"}`}>
                    <p className="text-xs font-semibold text-[#234568]">{market.label}</p>
                    <p className="mt-1 text-xs text-[#4b637d]">{market.displayRate}</p>
                    <p className="text-xs text-[#4b637d]">USD est: {formatMoney(market.hourlyWageUsdEstimate, locale)}/h</p>
                    <p className="mt-1 text-[11px] text-[#6b819a]">{market.effectiveDate}</p>
                    <p className="text-[11px] text-[#6b819a]">{market.sourceLabel}</p>
                    <p className="text-[11px] text-[#6b819a]">{market.estimateNote}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] font-medium text-[#6b819a]">{copy.wageAssumptionsNote}</p>
            </div>

            <div className="mt-4 rounded-xl border border-[#d8e4f2] bg-[#f8fbff] p-4">
              <p className="text-sm font-semibold text-[#234568]">{copy.financeCalculationTitle}</p>
              <ul className="mt-2 space-y-1 text-sm text-[#5a7089]">
                {copy.financeCalculationLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs font-medium text-[#6b819a]">{copy.financeWorkingDaysNote}</p>
            </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-[#d8e4f2] bg-[#f8fbff] p-4">
                  <p className="text-sm font-semibold text-[#234568]">{copy.scenarioOneTitle}</p>
                  <p className="text-sm text-[#5a7089]">
                    {copy.scenarioOneDetails} {formatMoney(selectedHourlyWageUsd, locale)}/h x 8h x 1.25 = {formatMoney(scenarioAFullTimeDailyLaborCost, locale)}/day.
                  </p>
                  <p className="text-xs font-medium text-[#2f6fed]">{copy.mandatorySetupNote}</p>
                  <ScenarioNetTable
                    locale={locale}
                    rows={fullTimeRows}
                    labels={{
                      period: copy.periodLabel,
                      laborCost: copy.laborCostLabel,
                      appCost: copy.appCostLabel,
                      netResult: copy.netResultLabel,
                      savings: copy.savingsResultLabel,
                      loss: copy.lossResultLabel,
                    }}
                  />
                  <p className="text-xs font-medium text-[#5a7089]">
                    {copy.firstMonthLabel}:{" "}
                    <span className={fullTimeFirstMonthNet >= 0 ? "text-[#136a34]" : "text-[#b42318]"}>
                      {formatMoney(fullTimeFirstMonthNet, locale)} ({fullTimeFirstMonthNet >= 0 ? copy.savingsResultLabel : copy.lossResultLabel})
                    </span>
                  </p>
                </div>

                <div className="space-y-3 rounded-xl border border-[#d8e4f2] bg-[#f8fbff] p-4">
                  <p className="text-sm font-semibold text-[#234568]">{copy.scenarioTwoTitle}</p>
                  <p className="text-sm text-[#5a7089]">{copy.scenarioTwoDetails}</p>
                  <p className="text-xs font-medium text-[#2f6fed]">{copy.mandatorySetupNote}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-[#234568]">
                      {copy.scenarioBHoursLabel}
                      <input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={scenarioBHoursPerDay}
                        onChange={(event) => {
                          const parsed = Number(event.target.value);
                          if (!Number.isFinite(parsed)) return;
                          const clamped = Math.max(0, Math.min(24, parsed));
                          setScenarioBHoursPerDay(clamped);
                        }}
                        className="mt-1 h-10 w-full rounded-lg border border-[#c8d8eb] bg-white px-3 text-sm font-medium text-[#183b67]"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[#234568]">
                      {copy.scenarioBDaysLabel}
                      <input
                        type="number"
                        min={0}
                        max={7}
                        step={0.5}
                        value={scenarioBDaysPerWeek}
                        onChange={(event) => {
                          const parsed = Number(event.target.value);
                          if (!Number.isFinite(parsed)) return;
                          const clamped = Math.max(0, Math.min(7, parsed));
                          setScenarioBDaysPerWeek(clamped);
                        }}
                        className="mt-1 h-10 w-full rounded-lg border border-[#c8d8eb] bg-white px-3 text-sm font-medium text-[#183b67]"
                      />
                    </label>
                  </div>
                  <div className="rounded-lg border border-[#d8e4f2] bg-white p-3">
                    <p className="text-xs font-semibold text-[#234568]">{copy.scenarioBFormulaLabel}</p>
                    <p className="mt-1 text-xs text-[#5a7089]">
                      {formatMoney(selectedHourlyWageUsd, locale)}/h x {formatNumber(scenarioBHoursPerDay, locale)}h x {formatNumber(scenarioBDaysPerWeek, locale)} days = {formatMoney(scenarioBWeeklyLaborCost, locale)} / week
                    </p>
                    <p className="mt-1 text-[11px] text-[#6b819a]">{copy.scenarioBFormulaNote}</p>
                  </div>
                  <ScenarioNetTable
                    locale={locale}
                    rows={partTimeRows}
                    labels={{
                      period: copy.periodLabel,
                      laborCost: copy.laborCostLabel,
                      appCost: copy.appCostLabel,
                      netResult: copy.netResultLabel,
                      savings: copy.savingsResultLabel,
                      loss: copy.lossResultLabel,
                    }}
                  />
                  <p className="text-xs font-medium text-[#5a7089]">
                    {copy.firstMonthLabel}:{" "}
                    <span className={partTimeFirstMonthNet >= 0 ? "text-[#136a34]" : "text-[#b42318]"}>
                      {formatMoney(partTimeFirstMonthNet, locale)} ({partTimeFirstMonthNet >= 0 ? copy.savingsResultLabel : copy.lossResultLabel})
                    </span>
                  </p>
                </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#d8e4f2] bg-[#f8fbff] p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f6fed]">{copy.firstYearSummaryLabel}</p>
                <p className="mt-1 text-base text-[#4b637d]">
                  {copy.scenarioOneTitle}: {formatMoney(fullTimeRows[3].net, locale)} ({fullTimeRows[3].net >= 0 ? copy.savingsResultLabel : copy.lossResultLabel})
                </p>
                <p className="mt-1 text-base text-[#4b637d]">
                  {copy.scenarioTwoTitle}: {formatMoney(partTimeRows[3].net, locale)} ({partTimeRows[3].net >= 0 ? copy.savingsResultLabel : copy.lossResultLabel})
                </p>
            </div>
          </div>
        ),
      },
      {
        id: "outcomes",
        content: (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#d8e4f2] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(15,39,69,0.22)]">
              <h2 className="text-2xl font-bold">{copy.outcomesTitle}</h2>
              <div className="mt-6 space-y-4">
                {copy.outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf1ff] text-[#2f6fed]">
                      <CalendarCheck className="h-4 w-4" />
                    </span>
                    <p className="text-base leading-relaxed text-[#4b637d]">{outcome}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-[#d8e4f2] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(15,39,69,0.18)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf1ff] text-[#2f6fed]">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <h3 className="text-xl font-bold">{copy.whyTitle}</h3>
                </div>
                <p className="mt-4 text-base leading-relaxed text-[#5a7089]">{copy.whyBody}</p>
              </div>

              <div className="rounded-2xl border border-[#d8e4f2] bg-white p-7 shadow-[0_20px_50px_-30px_rgba(15,39,69,0.18)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf1ff] text-[#2f6fed]">
                    <Zap className="h-5 w-5" />
                  </span>
                  <h3 className="text-xl font-bold">{copy.rolloutTitle}</h3>
                </div>
                <ol className="mt-4 space-y-3 text-[#5a7089]">
                  {copy.rolloutSteps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#f0f6ff] text-xs font-semibold text-[#2f6fed]">
                        {index + 1}
                      </span>
                      <span className="text-base leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "cta",
        content: (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-[#d8e4f2] bg-white p-8 shadow-[0_20px_50px_-30px_rgba(15,39,69,0.2)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f6fed]">{tenantName}</p>
              <p className="mt-2 text-lg text-[#5a7089]">Executive presentation route is private and intentionally not listed in navigation.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={whatsappUrl || `mailto:${email}`}
                className="inline-flex h-11 items-center rounded-xl bg-[#2f6fed] px-5 text-sm font-semibold text-white hover:bg-[#245cd0]"
                target={whatsappUrl ? "_blank" : undefined}
                rel={whatsappUrl ? "noopener noreferrer" : undefined}
              >
                {copy.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex h-11 items-center rounded-xl border border-[#c8d8eb] bg-white px-5 text-sm font-semibold text-[#183b67] hover:bg-[#f5f9ff]"
              >
                <Receipt className="mr-2 h-4 w-4" />
                {copy.ctaSecondary}
              </a>
            </div>
          </div>
        ),
      },
    ],
    [
      copy,
      email,
      fullTimeFirstMonthNet,
      fullTimeRows,
      locale,
      partTimeFirstMonthNet,
      partTimeRows,
      scenarioBDaysPerWeek,
      scenarioBHoursPerDay,
      scenarioBWeeklyLaborCost,
      scenarioAFullTimeDailyLaborCost,
      selectedHourlyWageUsd,
      selectedMarketId,
      tenantName,
      whatsappUrl,
    ]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setSlide((current) => Math.min(current + 1, slides.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setSlide((current) => Math.max(current - 1, 0));
      }
      if (event.key.toLowerCase() === "f") {
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [slides.length]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  };

  return (
    <div className="bg-[#f7fbff] text-[#0f2745]">
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d8e4f2] bg-white px-4 py-2 text-sm font-semibold text-[#2f6fed]">
              <Sparkles className="h-4 w-4" />
              {copy.kicker}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[#5a7089]">
                {copy.slideLabel} {slide + 1}/{slides.length}
              </p>
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="inline-flex h-10 items-center rounded-xl border border-[#c8d8eb] bg-white px-3 text-sm font-semibold text-[#183b67] hover:bg-[#f5f9ff]"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    {copy.fullscreenExit}
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    {copy.fullscreenEnter}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="min-h-[60vh]">{slides[slide].content}</div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSlide((current) => Math.max(current - 1, 0))}
              disabled={slide === 0}
              className="inline-flex h-11 items-center rounded-xl border border-[#c8d8eb] bg-white px-4 text-sm font-semibold text-[#183b67] hover:bg-[#f5f9ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {copy.prevLabel}
            </button>

            <div className="flex items-center gap-2">
              {slides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSlide(index)}
                  aria-label={`${copy.slideLabel} ${index + 1}`}
                  className={`h-2.5 w-8 rounded-full transition ${index === slide ? "bg-[#2f6fed]" : "bg-[#d8e4f2]"}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSlide((current) => Math.min(current + 1, slides.length - 1))}
              disabled={slide === slides.length - 1}
              className="inline-flex h-11 items-center rounded-xl border border-[#2f6fed] bg-[#2f6fed] px-4 text-sm font-semibold text-white hover:bg-[#245cd0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.nextLabel}
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
