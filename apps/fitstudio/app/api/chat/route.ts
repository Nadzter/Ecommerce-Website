import { z } from "zod";

import {
  buildSystemPrompt,
  loadChatbotContext,
} from "@/lib/chatbot/systemPrompt";
import {
  streamAgentResponse,
  type ChatUserTurn,
} from "@/lib/chatbot/agent";
import { ApiErrors } from "@/lib/api";
import { getAuthContext } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(5000),
});

const chatBodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  studioId: z.string().optional(),
});

const encoder = new TextEncoder();

function sse(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(request: Request): Promise<Response> {
  // Auth + tenant resolution — both must pass before the model is called.
  const ctx = await getAuthContext();
  if (!ctx) {
    return Response.json(
      { success: false, error: ApiErrors.unauthorized().message },
      { status: 401 },
    );
  }
  const studio = await getCurrentStudio();
  if (ctx.studioId !== studio.id) {
    return Response.json(
      { success: false, error: ApiErrors.forbidden().message },
      { status: 403 },
    );
  }

  let body: z.infer<typeof chatBodySchema>;
  try {
    body = chatBodySchema.parse(await request.json());
  } catch {
    return Response.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }
  if (body.studioId && body.studioId !== studio.id) {
    return Response.json(
      { success: false, error: "studioId mismatch with subdomain" },
      { status: 400 },
    );
  }

  const chatCtx = await loadChatbotContext({
    userId: ctx.user.id,
    studioId: studio.id,
  });
  if (!chatCtx) {
    return Response.json(
      { success: false, error: "Member not found in this studio" },
      { status: 404 },
    );
  }

  const systemPrompt = buildSystemPrompt(chatCtx);
  const history: ChatUserTurn[] = body.messages.map((entry) => ({
    role: entry.role,
    content: entry.content,
  }));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await streamAgentResponse(
          {
            userId: ctx.user.id,
            studioId: studio.id,
            systemPrompt,
            history,
          },
          (token) => controller.enqueue(sse({ token })),
        );
        controller.enqueue(sse({ done: true }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "chatbot_error";
        console.error("[chat] stream error", error);
        controller.enqueue(sse({ error: message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
