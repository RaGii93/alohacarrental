import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getBaseUrl, toLocalePath } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const publicPaths = ["/", "/book", "/book/review"];
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const path of publicPaths) {
      const localizedPath = toLocalePath(locale, path);
      urls.push({
        url: `${base}${localizedPath === "/" ? "" : localizedPath}`,
        lastModified: now,
        changeFrequency: path === "/" ? "weekly" : "daily",
        priority: path === "/" ? 1 : 0.8,
      });
    }
  }

  return urls;
}

