"use client";

import { useEffect, useState } from "react";
import { resolveInitialLocale } from "../locale-preference.mjs";
import { defaultLocale } from "../site-path";
import type { Locale } from "../i18n/types";
import { PwaRuntime } from "./PwaRuntime";

export function PwaShell() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  useEffect(() => {
    const timer = window.setTimeout(() => setLocale(resolveInitialLocale(defaultLocale) as Locale), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <PwaRuntime locale={locale} />;
}
