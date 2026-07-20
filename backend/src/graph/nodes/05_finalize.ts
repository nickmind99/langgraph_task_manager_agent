import { State } from "../types";

export const finalizeNode = (state: State) => {
  const results = state?.results ?? [];
  const approved = state?.approved ?? false;
  const steps = state?.steps ?? [];
  const currentStatus = state.status;

  let status: State["status"];

  if (currentStatus === "cancelled" || !approved) {
    status = "cancelled";
  } else {
    status = "done";
  }

  let message: string;

  if (status === "cancelled") {
    message =
      state.message ?? (steps.length ? "User rejected the plan" : "Cancelled before starting");
  } else {
    message =
      state.message ??
      (results.length
        ? `Completed ${results.length} steps`
        : steps.length
          ? "Planned but not executed"
          : "Finished");
  }

  return {
    message,
    steps,
    status,
    results,
  };
};
