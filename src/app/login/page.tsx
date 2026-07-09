"use client";

import { useActionState } from "react";
import Image from "next/image";
import { authenticate } from "./actions";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-carbon-900 px-4">
      {/* Resplandor verde de fondo */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-brand-700/20 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="Mecatrónica Pilar — Taller de Motos"
            width={670}
            height={619}
            priority
            className="h-auto w-56 drop-shadow-xl"
          />
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-white/10 bg-white p-6 shadow-2xl"
        >
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-900">
              Iniciar sesión
            </h1>
            <p className="text-sm text-slate-500">Acceso al panel del taller</p>
          </div>

          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@taller.com"
            />
          </FormField>

          <FormField label="Contraseña" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </FormField>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Mecatrónica Pilar · Taller de Motos
        </p>
      </div>
    </main>
  );
}
