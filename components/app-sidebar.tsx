"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Car,
  CarFront,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CirclePlus,
  DollarSign,
  FileText,
  Grid2X2,
  Percent,
  Settings,
  Star,
  Tag,
  Truck,
  Undo2,
  XCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar(_: {
  userEmail: string;
  role: string;
  licenseActive: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0] || "en";
  const section = parts[2] || "bookings";
  const base = `/${locale}/admin`;
  const activeTab = section;
  const bookingsStatus = searchParams.get("bookings_status") || "pending";
  const vehiclesSubtab = searchParams.get("vehicles_subtab") || "manage";
  const tOr = (key: string, fallback: string, values?: Record<string, any>) =>
    t.has(key as any) ? t(key as any, values as any) : fallback;

  const menuItems = [
    { key: "bookings", label: tOr("admin.dashboard.tabs.bookings", "Bookings"), icon: ClipboardList },
    { key: "deliveries", label: tOr("admin.dashboard.tabs.deliveries", "Deliveries"), icon: Truck },
    { key: "returns", label: tOr("admin.dashboard.tabs.returns", "Returns"), icon: Undo2 },
    { key: "financial", label: tOr("admin.dashboard.tabs.financial", "Financial"), icon: DollarSign },
    { key: "fleet", label: tOr("admin.dashboard.tabs.fleet", "Fleet"), icon: CarFront },
    { key: "vehicles", label: tOr("admin.dashboard.tabs.vehicles", "Vehicle Management"), icon: Car },
    { key: "reviews", label: tOr("admin.dashboard.tabs.reviews", "Reviews"), icon: Star },
    { key: "settings", label: tOr("admin.dashboard.tabs.settings", "Settings"), icon: Settings },
    { key: "logs", label: "Logs", icon: FileText },
  ] as const;

  return (
    <Sidebar variant="inset" collapsible="icon" className="top-16 h-[calc(100svh-4rem)]">
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
      <SidebarRail />
    </Sidebar>
  );
}
