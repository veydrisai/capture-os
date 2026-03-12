import { requireUser } from "@/app/sessions.server";

const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_BASE = "https://api.cal.com/v1";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);

  if (!CALCOM_API_KEY) {
    return Response.json({ error: "CALCOM_API_KEY not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const timeMin = url.searchParams.get("timeMin");
  const timeMax = url.searchParams.get("timeMax");

  const params = new URLSearchParams({ apiKey: CALCOM_API_KEY });
  if (timeMin) params.set("dateFrom", timeMin.split("T")[0]);
  if (timeMax) params.set("dateTo", timeMax.split("T")[0]);

  try {
    const res = await fetch(`${CALCOM_BASE}/bookings?${params}`);
    if (!res.ok) throw new Error(`Cal.com API error: ${res.status}`);
    const data = await res.json();
    return Response.json({ items: data.bookings ?? [] });
  } catch (err: unknown) {
    console.error("Cal.com calendar fetch error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Failed to fetch Cal.com bookings" }, { status: 500 });
  }
}
