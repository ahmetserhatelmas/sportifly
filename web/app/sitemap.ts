import type { MetadataRoute } from "next";
import { catalog, hrefFor } from "@/lib/catalog";
import { legalLinks, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    "/",
    "/saha-kiralama",
    "/ozel-ders",
    "/hakkimizda",
    "/iletisim",
    ...legalLinks.map((l) => l.href),
    ...catalog.map(hrefFor),
  ];
  return pages.map((p) => ({
    url: `${site.url}${p}`,
    lastModified: now,
    changeFrequency: p === "/" ? "weekly" : "monthly",
    priority: p === "/" || p.startsWith("/saha") || p.startsWith("/ozel") ? 0.9 : 0.6,
  }));
}
