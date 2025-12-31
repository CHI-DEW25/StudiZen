import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function breakGoaldown(goalTitle) {
  const prompt = `
Break the following student goal into 5–7 clear, actionable steps.
Each step must be achievable in under 2-3 days.
Define each step concisely and have a clear outcome. 
They must be actions that are concrete and build momentum.
Each step must be a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound).
Return ONLY valid JSON in this format:

[
  { "title": "Step 1" },
  { "title": "Step 2" },
  { "title": "Step 3" },
  { "title": "Step 4" },
  { "title": "Step 5" },
  { "title": "Step 6" },
  { "title": "Step 7" }
]

Goal: "${goalTitle} && ${goalDescription} && ${goalDeadline} && ${goalCategory} && ${goalPriority} && ${goalCompleted} && ${goalSubtasks} && ${goalProgress} && ${goalProgressLogs} && ${goalStreak} && ${goalLastProgressDate}"
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const result = await model.generateContent(prompt);

  // Gemini returns text — parse it
  const text = result.response.text();
  return JSON.parse(text);
}