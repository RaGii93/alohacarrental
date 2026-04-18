import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getBaseUrl, getLocaleAlternates, PUBLIC_INDEXABLE_PATHS, toLocalePath } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const now = new Date();

  return PUBLIC_INDEXABLE_PATHS.flatMap((path) =>
    routing.locales.map((locale) => {
      const localizedPath = toLocalePath(locale, path);
      return {
        url: `${base}${localizedPath === "/" ? "" : localizedPath}`,
        lastModified: now,
        changeFrequency: path === "/" ? "weekly" : "daily",
        priority: path === "/" ? 1 : path === "/book" ? 0.9 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(getLocaleAlternates(path)).map(([key, value]) => [
              key,
              `${base}${value === "/" ? "" : value}`,
            ])
          ),
        },
      };
    })
  );
}
