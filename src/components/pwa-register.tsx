"use client";

import { useEffect } from "react";

/** Registra el service worker para habilitar la PWA (instalable + offline). */
export function PWARegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* si falla el registro, la app sigue funcionando igual */
    });
  }, []);

  return null;
}
