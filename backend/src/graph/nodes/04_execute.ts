import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../../utils/env";
import { State } from "../types";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const NotesSchema = z.object({
  notes: z.array(z.string().min(1).max(500)).min(1).max(20),
});

type Notes = z.infer<typeof NotesSchema>;

const getModel = () =>
  new ChatOpenAI({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    temperature: 0.2,
  });

const toHumanMessage = (steps: string[]) => {
  const list = JSON.stringify(steps, null, 0);

  return [
    "You are concise assistant.",
    'Given a list of steps, return a JSON object { "notes": string[] }',
    "Rules:",
    "- notes.length must be equals as steps.length",
    "Each note <= 300 characters",
    "Plain text, no markdown",
    "",
    `Steps=${list}`,
  ].join("\n");
};

export const executeNode = async (state: State) => {
  if (!state.approved) return {};

  const steps = state?.steps ?? [];

  if (steps.length < 1) return {};

  const model = getModel();

  const structured = model.withStructuredOutput(NotesSchema);

  const output = await structured.invoke([
    new SystemMessage("Return only valid JSON matching the schema"),
    new HumanMessage(toHumanMessage(steps)),
  ]);

  const count = Math.min(output?.notes.length, steps.length);
  const results = Array.from({ length: count }, (_, i) => ({
    step: steps[i],
    note: output.notes[i],
  }));

  return {
    results,
    status: "done",
    message: `Executed ${results.length} steps`,
  };
};
