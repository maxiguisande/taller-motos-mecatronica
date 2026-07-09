"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wrench,
  Layers,
  ClipboardList,
  ClipboardCheck,
  CalendarClock,
  Package,
  UserCog,
  Wallet,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(app)/actions";

const NAV_ADMIN = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/caja", label: "Caja", icon: Wallet },
  { href: "/mis-tareas", label: "Mis tareas", icon: ClipboardCheck },
  { href: "/turnos", label: "Turnos", icon: CalendarClock },
  { href: "/ordenes", label: "Órdenes de trabajo", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/servicios", label: "Servicios", icon: Wrench },
  { href: "/productos", label: "Repuestos", icon: Package },
  { href: "/grupos", label: "Grupos de servicios", icon: Layers },
  { href: "/empleados", label: "Empleados", icon: UserCog },
];

const NAV_EMPLEADO = [
  { href: "/mis-tareas", label: "Mis tareas", icon: ClipboardCheck },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Shell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; rol?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = user.rol === "admin" ? NAV_ADMIN : NAV_EMPLEADO;

  const navLinks = (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(pathname, href)
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-300 hover:bg-carbon-800 hover:text-white",
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );

  const userFooter = (
    <div className="border-t border-carbon-700/60 p-3">
      <div className="mb-2 px-2">
        <p className="truncate text-sm font-medium text-white">
          {user.name ?? "Usuario"}
        </p>
        <p className="truncate text-xs text-slate-400">{user.email}</p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar desktop */}
      <aside className="hidden bg-carbon-900 lg:flex lg:flex-col">
        <Link
          href="/"
          className="flex items-center justify-center border-b border-carbon-700/60 px-4 py-5"
        >
          <Image
            src="/logo.png"
            alt="Mecatrónica Pilar — Taller de Motos"
            width={670}
            height={619}
            priority
            className="h-auto w-[150px]"
          />
        </Link>
        <div className="flex-1 overflow-y-auto p-3">{navLinks}</div>
        {userFooter}
      </aside>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-col">
        {/* Topbar mobile */}
        <header className="flex h-16 items-center justify-between bg-carbon-900 px-4 lg:hidden">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Mecatrónica Pilar"
              width={670}
              height={619}
              priority
              className="h-11 w-auto"
            />
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-300 hover:bg-carbon-800 hover:text-white"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Drawer mobile */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/60"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-carbon-900 shadow-xl">
              <div className="flex h-16 items-center justify-between border-b border-carbon-700/60 px-4">
                <Image
                  src="/logo.png"
                  alt="Mecatrónica Pilar"
                  width={670}
                  height={619}
                  className="h-10 w-auto"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-300 hover:bg-carbon-800 hover:text-white"
                  aria-label="Cerrar menú"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">{navLinks}</div>
              {userFooter}
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
