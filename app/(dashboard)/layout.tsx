import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import { SessionProvider } from "next-auth/react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar user={session.user} />
        <main
          style={{
            flex: 1,
            marginLeft: 224,
            minHeight: "100vh",
            padding: "36px 40px",
          }}
        >
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
