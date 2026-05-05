"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  Car,
  CarFront,
  Bell,
  ClipboardList,
  Cog,
  Clock3,
  CircleHelp,
  CirclePlus,
  DollarSign,
  FileText,
  Grid2X2,
  Handshake,
  LayoutDashboard,
  MapPin,
  Package,
  Percent,
  ShieldAlert,
  Settings,
  Star,
  Zap,
  Tag,
  Truck,
  Undo2,
  Users,
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
  userEmail,
  licenseActive,
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
  const section = hasLocalePrefix ? (parts[2] || "dashboard") : (parts[1] || "dashboard");
  const base = "/admin";
  const activeTab = section;
  const vehiclesSubtab = searchParams.get("vehicles_subtab") || "manage";
  const tOr = (key: string, fallback: string, values?: Record<string, any>) =>
    t.has(key as any) ? t(key as any, values as any) : fallback;

  const menuItems = [
    { key: "dashboard", label: tOr("admin.dashboard.tabs.dashboard", "Dashboard"), icon: LayoutDashboard },
    { key: "bookings", label: tOr("admin.dashboard.tabs.bookings", "Bookings"), icon: ClipboardList },
    { key: "deliveries", label: tOr("admin.dashboard.tabs.deliveries", "Deliveries"), icon: Truck },
    { key: "returns", label: tOr("admin.dashboard.tabs.returns", "Returns"), icon: Undo2 },
    { key: "fleet", label: tOr("admin.dashboard.tabs.fleet", "Fleet"), icon: CarFront },
    { key: "notifications", label: tOr("admin.dashboard.tabs.notifications", "Notifications"), icon: Bell },
    ...(role === "ROOT" || role === "OWNER"
      ? [
          { key: "customers", label: tOr("admin.dashboard.tabs.customers", "Customers"), icon: Users },
          { key: "vehicles", label: tOr("admin.dashboard.tabs.vehicles", "Vehicle Management"), icon: Car },
          { key: "blockouts", label: tOr("admin.dashboard.tabs.blockouts", "Availability Blocks"), icon: Clock3 },
          { key: "financial", label: tOr("admin.dashboard.tabs.financial", "Financial"), icon: DollarSign },
          { key: "reviews", label: tOr("admin.dashboard.tabs.reviews", "Reviews"), icon: Star },
          { key: "locations", label: tOr("admin.dashboard.tabs.locations", "Locations"), icon: MapPin },
          { key: "inventory", label: tOr("admin.dashboard.tabs.inventory", "Inventory"), icon: Package },
          { key: "maintenance", label: tOr("admin.dashboard.tabs.maintenance", "Maintenance"), icon: ShieldAlert },
          { key: "partner-rentals", label: tOr("admin.dashboard.tabs.partnerRentals", "Partner Rentals"), icon: Handshake },
          ...(invoiceProvider === "QUICKBOOKS"
            ? [{ key: "quickbooks", label: tOr("admin.dashboard.tabs.quickbooks", "QuickBooks"), icon: FileText }]
            : invoiceProvider === "ZOHO"
              ? [{ key: "zoho", label: tOr("admin.dashboard.tabs.zoho", "Zoho Invoice"), icon: FileText }]
              : []),
          { key: "automations", label: tOr("admin.dashboard.tabs.automations", "Automations"), icon: Zap },
          { key: "logs", label: tOr("admin.dashboard.tabs.logs", "Logs"), icon: FileText },
          { key: "users", label: tOr("admin.dashboard.tabs.users", "Users"), icon: Users },
        ]
      : []),
    { key: "settings", label: tOr("admin.dashboard.tabs.settings", "Settings"), icon: Settings },
    { key: "help", label: tOr("admin.dashboard.tabs.help", "Help Center"), icon: CircleHelp },
  ] as const;

  return (
    <Sidebar
      collapsible={collapsible}
      className={cn(
        "h-svh bg-white shadow-[0_10px_28px_-18px_rgba(0,0,0,0.1)] ring-1 ring-[rgba(0,0,0,0.05)]",
        className
      )}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto justify-start px-2 py-2">
              <Link href={`${base}`}>
                <Image src="/home/logo.png" alt="Aloha Car Rental" width={120} height={40} className="h-10 w-auto" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#a16255]">{tOr("common.navigation", "Navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild isActive={activeTab === item.key} tooltip={item.label}>
                    <Link
                      href={item.key === "dashboard" ? `${base}` : `${base}/${item.key}`}
                      className="rounded-xl data-[active=true]:bg-red-50 data-[active=true]:text-red-700 data-[active=true]:shadow-[inset_0_0_0_1px_rgba(239,68,68,0.18)] [&_svg]:transition-colors data-[active=true]:[&_svg]:text-red-600"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.key === "vehicles" && activeTab === "vehicles" && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "manage"}>
                          <Link
                            href={`${base}/vehicles?vehicles_subtab=manage`}
                            className="rounded-lg data-[active=true]:bg-red-50 data-[active=true]:text-red-700 [&_svg]:transition-colors data-[active=true]:[&_svg]:text-red-600"
                          >
                            <ClipboardList className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.manage", "Manage")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "pricing"}>
                          <Link
                            href={`${base}/vehicles?vehicles_subtab=pricing`}
                            className="rounded-lg data-[active=true]:bg-red-50 data-[active=true]:text-red-700 [&_svg]:transition-colors data-[active=true]:[&_svg]:text-red-600"
                          >
                            <Tag className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.pricing", "Pricing")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "categories"}>
                          <Link
                            href={`${base}/vehicles?vehicles_subtab=categories`}
                            className="rounded-lg data-[active=true]:bg-red-50 data-[active=true]:text-red-700 [&_svg]:transition-colors data-[active=true]:[&_svg]:text-red-600"
                          >
                            <Grid2X2 className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.categories", "Categories")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "features"}>
                          <Link
                            href={`${base}/vehicles?vehicles_subtab=features`}
                            className="rounded-lg data-[active=true]:bg-red-50 data-[active=true]:text-red-700 [&_svg]:transition-colors data-[active=true]:[&_svg]:text-red-600"
                          >
                            <Cog className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.features", "Features")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "extras"}>
                          <Link
                            href={`${base}/vehicles?vehicles_subtab=extras`}
                            className="rounded-lg data-[active=true]:bg-red-50 data-[active=true]:text-red-700 [&_svg]:transition-colors data-[active=true]:[&_svg]:text-red-600"
                          >
                            <CirclePlus className="h-4 w-4" />
                            <span>{tOr("admin.dashboard.vehicles.extras", "Extras")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={vehiclesSubtab === "discounts"}>
                          <Link
                            href={`${base}/vehicles?vehicles_subtab=discounts`}
                            className="rounded-lg data-[active=true]:bg-red-50 data-[active=true]:text-red-700 [&_svg]:transition-colors data-[active=true]:[&_svg]:text-red-600"
                          >
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
        <div className="rounded-xl bg-[#fff7f5] px-3 py-2 text-xs font-medium text-[#a16255]">
          {tOr("admin.dashboard.title", "Admin")}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
