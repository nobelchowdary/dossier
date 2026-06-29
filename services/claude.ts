import Anthropic from "@anthropic-ai/sdk";
import { IntegrationConfigError } from "@/lib/errors";

let anthropicClient: Anthropic | null = null;

function getClaude() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new IntegrationConfigError("Claude", ["ANTHROPIC_API_KEY"]);
  }

  anthropicClient ??= new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  return anthropicClient;
}

export async function generateProjectSummary(input: {
  projectName: string;
  activities: string[];
  messages: string[];
  milestones: string[];
}) {
  const model = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514";

  const response = await getClaude().messages.create({
    model,
    max_tokens: 500,
    system: `
      You are a senior client success manager writing updates for clients.

      Generate a short, professional project update that can be displayed inside a client portal.

      Requirements:
      - 80 to 150 words.
      - Plain text only.
      - No markdown.
      - No headings.
      - No tables.
      - No emojis.
      - No bullet points.
      - Use simple business language.
      - Summarize completed work, current progress, upcoming work, and blockers.
      - If there are no blockers, explicitly mention that the project is on track.
      - Write in a reassuring and client-friendly tone.
      - Never expose raw activity logs or system events.
    `,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          projectName: input.projectName,
          recentActivity: input.activities,
          recentMessages: input.messages,
          milestones: input.milestones,
        }),
      },
    ],
  });

  const content = response.content[0];
  return content.type === "text" ? content.text : "No summary was generated.";
}