"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  triggerClassName,
  contentClassName,
}: {
  triggerClassName?: string;
  contentClassName?: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });

    // Store locale preference in cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger
        className={cn(
          "h-10 w-[170px] rounded-full border-slate-300 bg-white px-3 text-sm font-medium shadow-sm",
          triggerClassName,
        )}
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-slate-500" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent align="end" className={cn("min-w-[170px]", contentClassName)}>
        <SelectItem value="en">English (EN)</SelectItem>
        <SelectItem value="es">Español (ES)</SelectItem>
        <SelectItem value="nl">Nederlands (NL)</SelectItem>
      </SelectContent>
    </Select>
  );
}
