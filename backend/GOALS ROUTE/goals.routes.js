import express from "express";
import { breakGoalIntoSteps } from "../services/ai.service.js";

const router = express.Router();

router.post("/:id/breakdown", async (req, res) => {
  try {
    const { title } = req.body;

    const steps = await breakGoalIntoSteps(title);
    res.json(steps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI breakdown failed" });
  }
});

export default router;
