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
    const text = await res.text();

    if (!res.ok) {
      console.error(`[api.calendar] Cal.com error ${res.status}:`, text);
      return Response.json(
        { error: `Cal.com API error ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    let data: { bookings?: unknown[] };
    try {
      data = JSON.parse(text);
    } catch {
      console.error("[api.calendar] Invalid JSON from Cal.com:", text.slice(0, 200));
      return Response.json({ error: "Invalid response from Cal.com API" }, { status: 502 });
    }

    return Response.json({ items: data.bookings ?? [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch Cal.com bookings";
    console.error("[api.calendar] Fetch error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
