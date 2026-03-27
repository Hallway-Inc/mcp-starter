import { config } from "dotenv";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

config({ quiet: true });

export const env = createEnv({
  server: {
    MAILERSEND_API_KEY: z.string().min(1),
    DATABASE_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
