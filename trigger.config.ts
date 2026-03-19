import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  // Replace with your project ref from trigger.dev dashboard (Project Settings → API Keys)
  project: (process.env.TRIGGER_PROJECT_REF ?? "proj_placeholder") as string,
  dirs: ["./trigger"],
} as Parameters<typeof defineConfig>[0]);
