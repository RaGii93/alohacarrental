import type { MetadataRoute } from "next";
import { getBaseUrl, PRIVATE_API_PREFIXES, PRIVATE_PATH_PREFIXES } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          ...PRIVATE_PATH_PREFIXES.flatMap((prefix) => [prefix, `${prefix}/*`, `/*${prefix}`, `/*${prefix}/*`]),
          ...PRIVATE_API_PREFIXES.flatMap((prefix) => [prefix, `${prefix}*`]),
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
