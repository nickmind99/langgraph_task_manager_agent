// START node

import { State } from "../types";

export const validateNode = async (state: State): Promise<Partial<State>> => {
  let input = (state.input ?? "").trim();

  if (input?.length < 1)
    return {
      status: "cancelled",
      message: "Please provide a proper prompt",
    };

  if (input.length > 300) input = input.slice(0, 300) + "...";

  return {
    input,
  };
};
