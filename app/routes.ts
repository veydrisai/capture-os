import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("login", "routes/login.tsx"),

  // Google OAuth
  route("auth/google", "routes/auth.google.ts"),
  route("auth/google/callback", "routes/auth.google.callback.ts"),
  route("auth/logout", "routes/auth.logout.ts"),

  // Dashboard (auth-protected)
  layout("routes/_layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("contacts", "routes/contacts.tsx"),
    route("leads", "routes/leads.tsx"),
    route("deals", "routes/deals.tsx"),
    route("clients", "routes/clients.tsx"),
    route("activity", "routes/activity.tsx"),
    route("calendar", "routes/calendar.tsx"),
    route("settings", "routes/settings.tsx"),
    route("playbook", "routes/playbook.tsx"),
  ]),

  // JSON API routes
  route("api/contacts", "routes/api.contacts.ts"),
  route("api/contacts/:id", "routes/api.contacts.$id.ts"),
  route("api/deals", "routes/api.deals.ts"),
  route("api/deals/:id", "routes/api.deals.$id.ts"),
  route("api/leads", "routes/api.leads.ts"),
  route("api/leads/:id", "routes/api.leads.$id.ts"),
  route("api/clients", "routes/api.clients.ts"),
  route("api/clients/:id", "routes/api.clients.$id.ts"),
  route("api/activities", "routes/api.activities.ts"),
  route("api/workspace-settings", "routes/api.workspace-settings.ts"),
  route("api/send-onboarding", "routes/api.send-onboarding.ts"),
] satisfies RouteConfig;
