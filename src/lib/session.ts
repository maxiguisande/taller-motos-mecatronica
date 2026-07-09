import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.rol !== "admin") redirect("/mis-tareas");
  return user;
}

export function esAdmin(user: { rol?: string } | null | undefined) {
  return user?.rol === "admin";
}
