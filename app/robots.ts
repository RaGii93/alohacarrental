import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();

  // Keep indexing focused on public marketing/informational pages.
  const disallowPaths = [
    "/admin",
    "/admin/*",
    "/*/admin",
    "/*/admin/*",
    "/api/*",
    "/book/review",
    "/book/success/*",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowPaths,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
