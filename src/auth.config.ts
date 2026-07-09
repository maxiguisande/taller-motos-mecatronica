import type { NextAuthConfig } from "next-auth";

// Configuración base compartida. NO incluye el provider de credenciales
// (que usa Prisma + bcrypt) para que el middleware pueda correr en el
// runtime "edge" sin dependencias de Node.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const rol = auth?.user?.rol;
      const p = nextUrl.pathname;
      const inicio = rol === "admin" ? "/" : "/mis-tareas";

      if (p.startsWith("/login")) {
        if (isLoggedIn) return Response.redirect(new URL(inicio, nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      // Los empleados solo acceden a "Mis tareas" y al detalle de una orden
      // (para trabajarla). El resto del panel es solo para admins.
      if (rol !== "admin") {
        const permitido =
          p === "/mis-tareas" ||
          /^\/ordenes\/[a-z0-9]+$/i.test(p) ||
          p.startsWith("/api/"); // los route handlers validan permisos por su cuenta
        if (!permitido) return Response.redirect(new URL("/mis-tareas", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) token.rol = user.rol;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.rol = token.rol as string | undefined;
        if (token.sub) session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
