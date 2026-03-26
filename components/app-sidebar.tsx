"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  Car,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Cog,
  Clock3,
  CircleHelp,
  CirclePlus,
  DollarSign,
  FileText,
  Grid2X2,
  MapPin,
  Percent,
  Settings,
  Star,
  Tag,
  Truck,
  Undo2,
  Users,
  XCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar({
  role,
  invoiceProvider,
  className,
  collapsible = "icon",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userEmail: string;
  role: string;
  licenseActive: boolean;
  invoiceProvider: "NONE" | "QUICKBOOKS" | "ZOHO";
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parts = pathname.split("/").filter(Boolean);
  const hasLocalePrefix = routing.locales.includes(parts[0] as any);
  const section = hasLocalePrefix ? (parts[2] || "bookings") : (parts[1] || "bookings");
  const base = "/admin";
  const activeTab = section;
  const bookingsStatus = searchParams.get("bookings_status") || "pending";
  const vehiclesSubtab = searchParams.get("vehicles_subtab") || "manage";
  const tOr = (key: string, fallback: string, values?: Record<string, any>) =>
    t.has(key as any) ? t(key as any, values as any) : fallback;

  const menuItems = [
    { key: "bookings", label: tOr("admin.dashboard.tabs.bookings", "Bookings"), icon: ClipboardList },
    { key: "deliveries", label: tOr("admin.dashboard.tabs.deliveries", "Deliveries"), icon: Truck },
    { key: "returns", label: tOr("admin.dashboard.tabs.returns", "Returns"), icon: Undo2 },
    { key: "fleet", label: tOr("admin.dashboard.tabs.fleet", "Fleet"), icon: CarFront },
    { key: "help", label: tOr("admin.dashboard.tabs.help", "Help Center"), icon: CircleHelp },
    ...(role === "ROOT" || role === "OWNER"
      ? [
          { key: "financial", label: tOr("admin.dashboard.tabs.financial", "Financial"), icon: DollarSign },
          ...(invoiceProvider === "QUICKBOOKS"
            ? [{ key: "quickbooks", label: tOr("admin.dashboard.tabs.quickbooks", "QuickBooks"), icon: FileText }]
            : invoiceProvider === "ZOHO"
              ? [{ key: "zoho", label: tOr("admin.dashboard.tabs.zoho", "Zoho Invoice"), icon: FileText }]
              : []),
          { key: "blockouts", label: tOr("admin.dashboard.tabs.blockouts", "Availability Blocks"), icon: Clock3 },
          { key: "vehicles", label: tOr("admin.dashboard.tabs.vehicles", "Vehicle Management"), icon: Car },
          { key: "reviews", label: tOr("admin.dashboard.tabs.reviews", "Reviews"), icon: Star },
          { key: "settings", label: tOr("admin.dashboard.tabs.settings", "Settings"), icon: Settings },
          { key: "locations", label: tOr("admin.dashboard.tabs.locations", "Locations"), icon: MapPin },
          { key: "logs", label: tOr("admin.dashboard.tabs.logs", "Logs"), icon: FileText },
          { key: "users", label: tOr("admin.dashboard.tabs.users", "Users"), icon: Users },
        ]
      : []),
  ] as const;

  return (
    <Sidebar
      collapsible={collapsible}
      className={cn(
        "h-svh bg-white shadow-[0_10px_28px_-18px_hsl(215_28%_17%/0.1)] ring-1 ring-[hsl(215_25%_27%/0.05)]",
        className
      )}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto justify-start px-2 py-2">
              <Link href={`${base}/bookings`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                  <CarFront className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">
                  {tOr("admin.dashboard.title", "Admin")}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{tOr("common.navigation", "Navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild isActive={activeTab === item.key} tooltip={item.label}>
                    <Link href={`${base}/${item.key}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.key === "bookings" && activeTab === "bookings" && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={bookingsStatus === "pending"}>
                          <Link href={`${base}/bookings?bookings_status=pending`}>
                            <Clock3 className="h-4 w-4" />
                            <span>{tOr("admin.tabs.pending", "Pending")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={bookingsStatus === "confirmed"}>
                          <Link href={`${base}/bookings?bookings_status=confirmed`}>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{tOr("admin.tabs.confirmed", "Confirmed")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={bookingsStatus === "declined"}>
                          <Link href={`${base}/bookings?bookings_status=declined`}>
                            <XCircle className="h-4 w-4" />
                            <span>{tOr("admin.tabs.declined", "Declined")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                  {item.key === "vehicles" && activeTab === "vehicles" && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "manage"}>
                          <Link href={`${base}/vehicles?vehicles_subtab=manage`}>
                            <ClipboardList className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.manage", "Manage")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "pricing"}>
                          <Link href={`${base}/vehicles?vehicles_subtab=pricing`}>
                            <Tag className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.pricing", "Pricing")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "categories"}>
                          <Link href={`${base}/vehicles?vehicles_subtab=categories`}>
                            <Grid2X2 className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.categories", "Categories")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "features"}>
                          <Link href={`${base}/vehicles?vehicles_subtab=features`}>
                            <Cog className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.features", "Features")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "extras"}>
                          <Link href={`${base}/vehicles?vehicles_subtab=extras`}>
                            <CirclePlus className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.extras", "Extras")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "discounts"}>
                          <Link href={`${base}/vehicles?vehicles_subtab=discounts`}>
                            <Percent className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.discounts", "Discounts")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-xl bg-[hsl(220_33%_98%)] px-3 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
          {tOr("admin.dashboard.title", "Admin")}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
