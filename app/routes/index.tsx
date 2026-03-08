import { redirect } from "react-router";
import { getUserId } from "@/app/sessions.server";

export async function loader({ request }: { request: Request }) {
  const userId = await getUserId(request);
  return redirect(userId ? "/dashboard" : "/login");
}

export default function Index() {
  return null;
}
