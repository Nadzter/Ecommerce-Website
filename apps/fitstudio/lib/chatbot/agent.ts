import Anthropic from "@anthropic-ai/sdk";

import { chatbotTools } from "./tools";
import { runTool } from "./toolHandlers";

const CHATBOT_MODEL = "claude-opus-4-8";
const MAX_TOKENS = 4096;
const MAX_TOOL_ITERATIONS = 6;

let clientSingleton: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (clientSingleton) return clientSingleton;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  clientSingleton = new Anthropic({ apiKey });
  return clientSingleton;
}

export interface ChatUserTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AgentContext {
  userId: string;
  studioId: string;
  systemPrompt: string;
  history: ChatUserTurn[];
}

/**
 * Lift the simple `{role, content: string}` history that arrives over the
 * wire into the SDK's content-block shape. Internal tool-use turns are
 * appended on top of this as the loop runs.
 */
function seedMessages(
  history: ChatUserTurn[],
): Anthropic.Messages.MessageParam[] {
  return history.map((entry) => ({
    role: entry.role,
    content: [{ type: "text", text: entry.content }],
  }));
}

/**
 * Execute every `tool_use` block in an assistant turn and return the
 * matching `tool_result` user message Claude needs on the next pass.
 */
async function executeToolUses(
  blocks: Anthropic.Messages.ContentBlock[],
  ctx: AgentContext,
): Promise<Anthropic.Messages.MessageParam> {
  const toolUses = blocks.filter(
    (block): block is Anthropic.Messages.ToolUseBlock =>
      block.type === "tool_use",
  );
  const results: Anthropic.Messages.ToolResultBlockParam[] = [];
  for (const use of toolUses) {
    const result = await runTool(use.name, use.input, {
      userId: ctx.userId,
      studioId: ctx.studioId,
    });
    results.push({
      type: "tool_result",
      tool_use_id: use.id,
      content: [{ type: "text", text: JSON.stringify(result) }],
      is_error: !result.ok,
    });
  }
  return { role: "user", content: results };
}

/**
 * Stream the chatbot's response. We run a manual tool loop: each
 * iteration starts a streaming `messages.create` call, pipes any text
 * tokens through `onToken`, then inspects the final stop_reason. When
 * the model emits `tool_use`, we execute the tools and loop again. When
 * it emits `end_turn`, we are done.
 *
 * Note: `thinking` is intentionally omitted. The installed SDK only
 * types `enabled` / `disabled`, not the newer `adaptive` mode our model
 * supports. The system prompt instructs the model to respond directly
 * without exploratory reasoning, which matches the skill's guidance
 * for cases where thinking has to stay off.
 */
export async function streamAgentResponse(
  ctx: AgentContext,
  onToken: (token: string) => void,
): Promise<void> {
  const client = getAnthropic();
  const messages = seedMessages(ctx.history);

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const stream = client.messages.stream({
      model: CHATBOT_MODEL,
      max_tokens: MAX_TOKENS,
      system: ctx.systemPrompt,
      tools: chatbotTools,
      messages,
    });

    stream.on("text", (delta) => onToken(delta));
    const finalMessage = await stream.finalMessage();
    messages.push({ role: "assistant", content: finalMessage.content });

    if (finalMessage.stop_reason !== "tool_use") return;

    const toolResultMessage = await executeToolUses(
      finalMessage.content,
      ctx,
    );
    messages.push(toolResultMessage);
  }
}

/**
 * Non-streaming variant used by the WhatsApp transport. We collect the
 * full text response (across any number of tool iterations) and return
 * it as a single string.
 */
export async function runAgentBlocking(ctx: AgentContext): Promise<string> {
  const client = getAnthropic();
  const messages = seedMessages(ctx.history);

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await client.messages.create({
      model: CHATBOT_MODEL,
      max_tokens: MAX_TOKENS,
      system: ctx.systemPrompt,
      tools: chatbotTools,
      messages,
    });
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      return response.content
        .filter(
          (block): block is Anthropic.Messages.TextBlock =>
            block.type === "text",
        )
        .map((block) => block.text)
        .join("");
    }

    const toolResultMessage = await executeToolUses(response.content, ctx);
    messages.push(toolResultMessage);
  }

  return "Sorry — I couldn't finish that request. Please try again or contact the studio.";
}
