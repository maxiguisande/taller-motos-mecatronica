"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  type FormState,
  zodToState,
  optionalStr,
  optionalNum,
  str,
} from "@/lib/form";

// ── Cliente + contactos ──────────────────────────────────
const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  direccion: z.string().optional(),
  notas: z.string().optional(),
});

const contactoSchema = z.object({
  tipo: z.enum(["celular", "fijo", "whatsapp", "email", "instagram"]),
  valor: z.string().min(1),
  etiqueta: z.string().optional().nullable(),
  principal: z.boolean().optional(),
});

function parseCliente(fd: FormData) {
  return clienteSchema.safeParse({
    nombre: str(fd, "nombre"),
    apellido: str(fd, "apellido"),
    direccion: optionalStr(fd, "direccion"),
    notas: optionalStr(fd, "notas"),
  });
}

function parseContactos(fd: FormData) {
  const raw = str(fd, "contactosJson");
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    const parsed = z.array(contactoSchema).safeParse(arr);
    if (!parsed.success) return [];
    return parsed.data
      .filter((c) => c.valor.trim() !== "")
      .map((c) => ({
        tipo: c.tipo,
        valor: c.valor.trim(),
        etiqueta: c.etiqueta || null,
        principal: !!c.principal,
      }));
  } catch {
    return [];
  }
}

// Motos cargadas en el mismo alta del cliente (datos principales).
const num = (v: unknown) =>
  v === "" || v == null ? undefined : Number(v);
const motoInlineSchema = z.object({
  marca: z.string().min(1),
  modelo: z.string().min(1),
  anio: z.preprocess(num, z.number().int().min(1900).max(2100).optional()),
  patente: z.string().optional(),
  cilindrada: z.preprocess(num, z.number().int().min(0).max(5000).optional()),
  color: z.string().optional(),
});

function parseMotos(fd: FormData) {
  const raw = str(fd, "motosJson");
  if (!raw) return [];
  try {
    const parsed = z.array(motoInlineSchema).safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return parsed.data
      .filter((m) => m.marca.trim() !== "" && m.modelo.trim() !== "")
      .map((m) => ({
        marca: m.marca.trim(),
        modelo: m.modelo.trim(),
        anio: m.anio ?? null,
        patente: m.patente?.trim() || null,
        cilindrada: m.cilindrada ?? null,
        color: m.color?.trim() || null,
      }));
  } catch {
    return [];
  }
}

export async function crearCliente(
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseCliente(fd);
  if (!parsed.success) return zodToState(parsed.error);

  const contactos = parseContactos(fd);
  const motos = parseMotos(fd);
  const cliente = await prisma.cliente.create({
    data: {
      ...parsed.data,
      contactos: { create: contactos },
      motos: { create: motos },
    },
  });
  revalidatePath("/clientes");

  // Si venimos desde otra pantalla (ej: nuevo turno/orden), volvemos ahí
  // con el cliente recién creado ya seleccionado.
  const returnTo = optionalStr(fd, "returnTo");
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    const sep = returnTo.includes("?") ? "&" : "?";
    redirect(`${returnTo}${sep}clienteId=${cliente.id}`);
  }
  redirect(`/clientes/${cliente.id}`);
}

export async function actualizarCliente(
  id: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseCliente(fd);
  if (!parsed.success) return zodToState(parsed.error);

  const contactos = parseContactos(fd);
  await prisma.$transaction([
    prisma.contacto.deleteMany({ where: { clienteId: id } }),
    prisma.cliente.update({
      where: { id },
      data: { ...parsed.data, contactos: { create: contactos } },
    }),
  ]);
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function eliminarCliente(id: string) {
  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
  redirect("/clientes");
}

// ── Motos ────────────────────────────────────────────────
const motoSchema = z.object({
  marca: z.string().min(1, "La marca es obligatoria"),
  modelo: z.string().min(1, "El modelo es obligatorio"),
  anio: z.number().int().min(1900).max(2100).optional(),
  patente: z.string().optional(),
  cilindrada: z.number().int().min(0).max(5000).optional(),
  color: z.string().optional(),
  numeroChasis: z.string().optional(),
  numeroMotor: z.string().optional(),
  fotoUrl: z.string().optional(),
  kmActual: z.number().int().min(0).optional(),
  proximoServiceKm: z.number().int().min(0).optional(),
  proximoServiceFecha: z.coerce.date().optional(),
  notas: z.string().optional(),
});

function parseMoto(fd: FormData) {
  const fecha = optionalStr(fd, "proximoServiceFecha");
  return motoSchema.safeParse({
    marca: str(fd, "marca"),
    modelo: str(fd, "modelo"),
    anio: optionalNum(fd, "anio"),
    patente: optionalStr(fd, "patente"),
    cilindrada: optionalNum(fd, "cilindrada"),
    color: optionalStr(fd, "color"),
    numeroChasis: optionalStr(fd, "numeroChasis"),
    numeroMotor: optionalStr(fd, "numeroMotor"),
    fotoUrl: optionalStr(fd, "fotoUrl"),
    kmActual: optionalNum(fd, "kmActual"),
    proximoServiceKm: optionalNum(fd, "proximoServiceKm"),
    proximoServiceFecha: fecha,
    notas: optionalStr(fd, "notas"),
  });
}

export async function crearMoto(
  clienteId: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseMoto(fd);
  if (!parsed.success) return zodToState(parsed.error);

  await prisma.moto.create({ data: { ...parsed.data, clienteId } });
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}

export async function actualizarMoto(
  id: string,
  clienteId: string,
  _prev: FormState | undefined,
  fd: FormData,
): Promise<FormState> {
  const parsed = parseMoto(fd);
  if (!parsed.success) return zodToState(parsed.error);

  await prisma.moto.update({ where: { id }, data: parsed.data });
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}

export async function eliminarMoto(id: string, clienteId: string) {
  await prisma.moto.delete({ where: { id } });
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}
