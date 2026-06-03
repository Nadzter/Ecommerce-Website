import { z } from "zod";

import { ApiErrors, ok, parseBody, withApi } from "@/lib/api";
import { requireOwner } from "@/lib/auth";
import { getAnthropic } from "@/lib/chatbot/agent";
import { getCurrentStudio } from "@/lib/tenant";

export const runtime = "nodejs";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 1024;

const generateSchema = z.object({
  prompt: z.string().min(1).max(2000),
  language: z.enum(["es", "en", "ar"]),
  channel: z.enum(["instagram_caption", "whatsapp_broadcast", "email"]),
});

const CHANNEL_DIRECTIVE: Record<
  z.infer<typeof generateSchema>["channel"],
  string
> = {
  instagram_caption:
    "Write a single Instagram caption (≤2,200 chars). Open with a punchy hook, include 1-3 short paragraphs, and end with 3-6 hashtags relevant to boutique fitness. Plain text only — no markdown.",
  whatsapp_broadcast:
    "Write a short WhatsApp broadcast (≤400 chars). One concrete benefit + one CTA. Plain text only.",
  email:
    "Write a marketing email with two sections labelled exactly 'Subject:' and 'Body:'. Subject ≤ 80 chars. Body 80-180 words. Plain text only, no markdown.",
};

const LANGUAGE_LABEL: Record<"es" | "en" | "ar", string> = {
  es: "Spanish (Spain)",
  en: "English",
  ar: "Arabic",
};

/**
 * Owner-only Claude call for the marketing copy generator. Single
 * round-trip — no tools, no streaming — because the output is short
 * and self-contained.
 */
export async function POST(request: Request): Promise<Response> {
  return withApi(async () => {
    await requireOwner();
    const studio = await getCurrentStudio();
    const input = await parseBody(request, generateSchema);

    const client = getAnthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: `You are a marketing copywriter for ${studio.name}, a boutique fitness studio. Match the studio's voice: warm, modern, energetic, professional. Write only the requested copy with no preamble, explanation, or markdown formatting. Respond exclusively in ${LANGUAGE_LABEL[input.language]}.`,
      messages: [
        {
          role: "user",
          content: `${CHANNEL_DIRECTIVE[input.channel]}\n\nWhat to promote: ${input.prompt.trim()}`,
        },
      ],
    });

    const text = response.content
      .filter((block): block is { type: "text"; text: string } & typeof block =>
        block.type === "text",
      )
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text) {
      throw ApiErrors.unprocessable("Claude returned an empty response");
    }
    return ok({ content: text, model: MODEL });
  });
}
