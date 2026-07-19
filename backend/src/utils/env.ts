import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "Api key is needed"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  PORT: z.string().default("5000"),
});

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) throw new Error("Error occurred while parsing env");

const envData = parsedEnv.data;

export const env = Object.freeze({
  OPENAI_API_KEY: envData.OPENAI_API_KEY,
  OPENAI_MODEL: envData.OPENAI_MODEL,
  PORT: envData.PORT,
});
