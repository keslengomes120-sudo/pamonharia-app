import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const storeName = (session.user as any).storeName;
  const role = (session.user as any).role ?? "operador";

  return (
    <div className="min-h-screen">
      <Sidebar storeName={storeName} role={role} />
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  );
}
