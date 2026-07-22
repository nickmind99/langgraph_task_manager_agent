import { Annotation, Command, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { validateNode } from "./nodes/01_validate";
import { planNode } from "./nodes/02_plan";
import { approveNode } from "./nodes/03_approve";
import { executeNode } from "./nodes/04_execute";
import { finalizeNode } from "./nodes/05_finalize";
import { getInitialState, State } from "./types";

const stateAnnotation = Annotation.Root({
  input: Annotation<string>,
  steps: Annotation<string[] | undefined>,
  approved: Annotation<boolean | undefined>,
  results: Annotation<{ step: string; note: string }[] | undefined>,
  status: Annotation<"planned" | "done" | "cancelled" | undefined>,
  message: Annotation<string | undefined>,
});

const builder = new StateGraph(stateAnnotation)
  .addNode("validate", validateNode)
  .addNode("plan", planNode)
  .addNode("approve", approveNode)
  .addNode("execute", executeNode)
  .addNode("finalize", finalizeNode);

builder
  .addEdge(START, "validate")
  .addEdge("validate", "plan")
  .addEdge("plan", "approve")
  .addEdge("execute", "finalize")
  .addEdge("finalize", END)
  .addConditionalEdges("approve", (state: State) => (state.approved ? "execute" : "finalize"));

const checkPointer = new MemorySaver();
const graph = builder.compile({
  checkpointer: checkPointer,
});

const toThreadId = () => `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const runAgent = async (
  input: string,
): Promise<{ interrupt: { threadId: string; steps: string[] } } | { final: State }> => {
  const threadId = toThreadId();
  const config = { configurable: { thread_id: threadId } };
  const result = (await graph.invoke(getInitialState(input), config)) as unknown as {
    __interrupt__: unknown;
  };

  if (result && result?.__interrupt__) {
    const firstItem = Array.isArray(result.__interrupt__)
      ? result.__interrupt__[0]
      : result.__interrupt__;

    const steps = (firstItem?.value?.steps as string[]) ?? [];
    return {
      interrupt: {
        threadId,
        steps,
      },
    };
  }

  return {
    final: result as unknown as State,
  };
};

export const resumeAgent = async (approveData: {
  threadId: string;
  approve: boolean;
}): Promise<State> => {
  const { threadId, approve } = approveData;
  const config = { configurable: { thread_id: threadId } };

  const finalState = (await graph.invoke(new Command({ resume: { approve } }), config)) as State;

  return finalState;
};
