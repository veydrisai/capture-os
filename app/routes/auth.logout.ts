import { redirect } from "react-router";
import { sessionStorage } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
