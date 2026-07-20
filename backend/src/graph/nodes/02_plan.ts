import { State } from "../types";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../../utils/env";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const PlanSchema = z.object({
  steps: z
    .array(z.string().min(5, "Keep each step a short sentence"))
    .max(150, "Keep each step concise")
    .min(1)
    .max(10),
});

type Plan = z.infer<typeof PlanSchema>;

const getModel = () =>
  new ChatOpenAI({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    temperature: 0.2,
  });

const SYSTEM_MESSAGE = [
  "You are a helpful planner.",
  "Return JSON that matches thr schema.",
  "Keep steps concrete, actionable and beginner friendly.",
].join("\n");

const toUserMessage = (input: string) =>
  [
    `User goal: ${input}`,
    "Draft a small plan with 3-5 steps",
    "Each step is a short sentence",
  ].join("\n");

export const planNode = async (state: State): Promise<Partial<State>> => {
  if (state.status === "cancelled") return {};

  const model = getModel();

  const structured = model.withStructuredOutput(PlanSchema);

  const plan = await structured.invoke([
    new SystemMessage(SYSTEM_MESSAGE),
    new HumanMessage(toUserMessage(state.input)),
  ]);

  const steps = Array.isArray(plan?.steps) ? plan.steps.slice(0, Math.max(0, 5)) : [];

  return { steps, status: "planned" };
};
