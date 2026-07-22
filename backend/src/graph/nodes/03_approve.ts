// Pause the graph and ask user approve these steps or not

import { State } from "../types";

type Decision = {
  approve: boolean;
};

export const approveNode = async (state: State, context: unknown) => {
  if (state.status === "cancelled") return {};

  const steps = state?.steps ?? [];

  if (steps.length < 1) return { approved: true, message: "No steps to approve." };

  const interrupt = (context as { interrupt: (payload: unknown) => Promise<unknown> })?.interrupt;

  const decision = await interrupt({
    type: "approval_request",
    steps,
  });

  let approved;

  if (decision && typeof decision === "object" && "approve" in (decision as Decision)) {
    approved = (decision as Decision).approve;
  } else {
    approved = !!decision;
  }

  return {
    approved,
  };
};
