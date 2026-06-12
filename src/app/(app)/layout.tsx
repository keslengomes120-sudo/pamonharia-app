import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { parsePermissions } from "@/components/layout/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const storeName = (session.user as any).storeName;
  const role = (session.user as any).role ?? "operador";
  const permissions = parsePermissions((session.user as any).permissions);

  return (
    <div className="min-h-screen">
      <Sidebar storeName={storeName} role={role} permissions={permissions} />
      <MobileHeader storeName={storeName} role={role} permissions={permissions} />
      <main className="md:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
