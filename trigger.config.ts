import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: (process.env.TRIGGER_PROJECT_REF ?? "proj_faunavpdzjxftdrqtzlm") as string,
  dirs: ["./trigger"],
  maxDuration: 300, // 5 minutes max per task run
} as Parameters<typeof defineConfig>[0]);
