import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import { SessionProvider } from "next-auth/react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <Sidebar user={session.user} />
        <main
          style={{
            flex: 1,
            marginLeft: 220,
            minHeight: "100vh",
            padding: "32px 36px",
          }}
        >
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
