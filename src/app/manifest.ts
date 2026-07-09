import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mecatrónica Pilar — Taller de Motos",
    short_name: "Mecatrónica",
    description:
      "Gestión del taller: clientes, órdenes de trabajo, turnos y repuestos.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1a22",
    theme_color: "#0f1a22",
    lang: "es-AR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
