import { Router } from "express";
import { z } from "zod";
import { resumeAgent, runAgent } from "../graph/graph";

const router = Router();

const StartShema = z.object({
  input: z.string().min(1, "Input is required"),
});

const ApproveShema = z.object({
  approve: z.boolean(),
  threadId: z.string().min(1, "threadId is required"),
});

router.post("/", async (req, res) => {
  const parseBody = StartShema.safeParse(req.body);

  if (!parseBody.success) {
    return res.status(400).json({
      status: "error",
      errorMessage: "Error while parsing input",
    });
  }

  try {
    const result = await runAgent(parseBody.data.input);

    if ("final" in result) {
      return res.json({
        status: "ok",
        data: {
          kind: "final",
          final: result.final,
        },
      });
    }

    if ("interrupt" in result) {
      return res.json({
        status: "ok",
        data: {
          kind: "needs_approval",
          interrupt: {
            steps: result.interrupt.steps,
            threadId: result.interrupt.threadId,
            prompt: "Approve the generated plan to execute or reject to cancel",
          },
        },
      });
    }
  } catch {
    return res.status(500).json({
      status: "error",
      errorMessage: "Some error occured",
    });
  }
});

router.post("/approve", async (req, res) => {
  const parseBody = ApproveShema.safeParse(req.body);

  if (!parseBody.success) {
    return res.status(400).json({
      status: "error",
      errorMessage: "Error while parsing input",
    });
  }

  try {
    const { threadId, approve } = parseBody.data;
    const final = await resumeAgent({ threadId, approve });

    return res.status(200).json({
      status: "ok",
      data: {
        kind: "final",
        final,
      },
    });
  } catch {
    return res.status(500).json({
      status: "error",
      errorMessage: "Some error occured",
    });
  }
});

export default router;
