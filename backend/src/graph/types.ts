// defines the state that flows through the LangGraph
// GRAPH = STATE + NODES + EDGES
// State is suite of fields that every node can read/update

import { z } from "zod";

// planned -> plan is ready but not yet approved
// done -> task is already executed and final result prepared
// cancelled -> case when uses rejected the flow, we stop properly
export const ExecutionStatus = z.enum(["planned", "done", "cancelled"]);
export type ExecutionStatus = z.infer<typeof ExecutionStatus>;

// step result
// each executed step can produce a shor and human readable outcome
export const StepResult = z.object({
  step: z.string(),
  note: z.string(),
});

// state -> zod schema
export const StateSchema = z.object({
  input: z.string().min(5, "Input is required"),
  steps: z.array(z.string()).optional(),
  approved: z.boolean().optional(),
  results: z.array(StepResult).optional(),
  status: ExecutionStatus.optional(),
  message: z.string().optional(),
});

export type State = z.infer<typeof StateSchema>;

// initial state function
export const initialState = (input: string): State => ({
  input,
  status: "planned",
});
