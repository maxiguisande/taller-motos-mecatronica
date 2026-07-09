import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 reemplazó "middleware" por "proxy".
// Usamos authConfig (sin Prisma ni bcrypt) para que corra en el runtime edge.
const { auth } = NextAuth(authConfig);

export default auth;

// Protege todas las rutas excepto: API de auth, assets de Next y archivos
// estáticos (cualquier ruta con un "." como /logo.png).
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
