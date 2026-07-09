import { Suspense } from "react";
import { auth } from "@/auth";
import { Shell } from "@/components/shell";
import { FlashToast } from "@/components/flash-toast";

// La app depende de la sesión y de la base: siempre dinámica.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <Shell
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        rol: session?.user?.rol,
      }}
    >
      {children}
      <Suspense>
        <FlashToast />
      </Suspense>
    </Shell>
  );
}
