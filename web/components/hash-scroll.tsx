"use client";

import { useEffect } from "react";

export function HashScroll() {
  useEffect(() => {
    if (window.location.hash !== "#indir") return;
    const el = document.getElementById("indir");
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);
  return null;
}
