import { Outlet, redirect } from "react-router";
import Sidebar from "@/components/layout/Sidebar";
import { getSession } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId) return redirect("/login");
  return {
    user: {
      name: (session.get("userName") ?? null) as string | null,
      email: (session.get("userEmail") ?? null) as string | null,
      image: (session.get("userImage") ?? null) as string | null,
    },
  };
}

export default function DashboardLayout({ loaderData }: { loaderData: Awaited<ReturnType<typeof loader>> }) {
  const data = loaderData as { user: { name: string | null; email: string | null; image: string | null } };
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar user={data.user} />
      <main style={{ marginLeft: 224, minHeight: "100vh", padding: "36px 40px", width: "calc(100vw - 224px)", overflowX: "hidden" }}>
        <Outlet />
      </main>
    </div>
  );
}
