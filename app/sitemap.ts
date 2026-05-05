import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getBaseUrl, toLocalePath } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const publicPaths = ["/", "/fleet", "/faq", "/book"];
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const path of publicPaths) {
      const localizedPath = toLocalePath(locale, path);
      urls.push({
        url: `${base}${localizedPath === "/" ? "" : localizedPath}`,
        lastModified: now,
        changeFrequency:
          path === "/" ? "weekly" : path === "/book" ? "daily" : "weekly",
        priority:
          path === "/"
            ? 1
            : path === "/fleet"
              ? 0.9
              : path === "/book"
                ? 0.85
                : 0.75,
      });
    }
  }

  return urls;
}
