import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { LogOut } from "lucide-react";

export function AdminPageHeader({
  title,
  subtitle,
  roleLabel,
  licenseLabel,
  licenseActive,
  locale,
  logoutLabel,
}: {
  title: string;
  subtitle: string;
  roleLabel: string;
  licenseLabel: string;
  licenseActive: boolean;
  locale: string;
  logoutLabel: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{roleLabel}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${licenseActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {licenseLabel}
          </span>
        </div>
      </div>
      <form action={logoutAction.bind(null, locale)}>
        <Button type="submit" variant="outline" className="inline-flex items-center gap-1.5">
          <LogOut className="h-4 w-4" />
          {logoutLabel}
        </Button>
      </form>
    </div>
  );
}
