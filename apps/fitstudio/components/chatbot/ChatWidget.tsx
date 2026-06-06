"use client";

import * as React from "react";
import { SignedIn } from "@clerk/nextjs";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  studio: {
    id: string;
    name: string;
    primaryColor: string;
  };
}

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

const ARABIC_REGEX = /[؀-ۿ]/;

function detectDir(text: string): "rtl" | "ltr" {
  return ARABIC_REGEX.test(text) ? "rtl" : "ltr";
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * Read the SSE stream from `/api/chat` and append tokens onto the
 * trailing assistant message. Resolves when the stream emits
 * `{done: true}`.
 */
async function consumeStream(
  response: Response,
  onToken: (token: string) => void,
  onError: (message: string) => void,
): Promise<void> {
  if (!response.body) throw new Error("Missing response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload) as
          | { token: string }
          | { done: true }
          | { error: string };
        if ("token" in parsed) onToken(parsed.token);
        else if ("error" in parsed) onError(parsed.error);
        else if ("done" in parsed) return;
      } catch {
        // Skip malformed chunks rather than killing the stream.
      }
    }
  }
}

function TypingDots(): JSX.Element {
  return (
    <div
      aria-label="Assistant is thinking"
      className="flex items-center gap-1 px-1 py-2 motion-reduce:hidden"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({
  message,
  studioPrimaryColor,
}: {
  message: ChatMessage;
  studioPrimaryColor: string;
}): JSX.Element {
  const isUser = message.role === "user";
  const dir = detectDir(message.content);
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <Avatar className="h-7 w-7">
          <AvatarFallback
            className="text-[10px] text-white"
            style={{ backgroundColor: studioPrimaryColor }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </AvatarFallback>
        </Avatar>
      ) : null}
      <div
        dir={dir}
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border bg-card text-foreground",
        )}
      >
        {message.content || (isUser ? null : <TypingDots />)}
      </div>
    </div>
  );
}

function ChatPanel({
  studio,
  open,
  onOpenChange,
}: {
  studio: ChatWidgetProps["studio"];
  open: boolean;
  onOpenChange: (next: boolean) => void;
}): JSX.Element {
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    {
      id: randomId(),
      role: "assistant",
      content: `Hi! I'm ${studio.name}'s assistant. Ask me about classes, your bookings, or your credits.`,
    },
  ]);
  const [draft, setDraft] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async (): Promise<void> => {
    const text = draft.trim();
    if (!text || pending) return;

    const userMessage: ChatMessage = {
      id: randomId(),
      role: "user",
      content: text,
    };
    const placeholder: ChatMessage = {
      id: randomId(),
      role: "assistant",
      content: "",
    };
    const nextMessages = [...messages, userMessage, placeholder];
    setMessages(nextMessages);
    setDraft("");
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studioId: studio.id,
          messages: nextMessages
            .filter((entry) => entry.id !== placeholder.id)
            .map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!response.ok) {
        throw new Error(
          `Chat unavailable (HTTP ${response.status})`,
        );
      }
      await consumeStream(
        response,
        (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === placeholder.id
                ? { ...msg, content: msg.content + token }
                : msg,
            ),
          );
        },
        (errorMessage) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === placeholder.id
                ? {
                    ...msg,
                    content: `Sorry — ${errorMessage}.`,
                  }
                : msg,
            ),
          );
        },
      );
    } catch (error) {
      const fallback =
        error instanceof Error ? error.message : "Something went wrong.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholder.id
            ? { ...msg, content: `Sorry — ${fallback}` }
            : msg,
        ),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader
          className="border-b px-5 py-4"
          style={{
            background: studio.primaryColor,
            color: "white",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"
              aria-hidden
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <SheetTitle className="text-base text-white">
                {studio.name}
              </SheetTitle>
              <p className="text-xs text-white/80">AI Assistant</p>
            </div>
          </div>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-4 py-4"
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              studioPrimaryColor={studio.primaryColor}
            />
          ))}
        </div>

        <form
          className="flex items-center gap-2 border-t bg-background p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about classes, bookings, credits…"
            disabled={pending}
            aria-label="Message"
            className="cursor-text"
          />
          <Button
            type="submit"
            size="icon"
            disabled={pending || !draft.trim()}
            className="cursor-pointer transition-colors duration-200"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Floating chat launcher rendered on every member portal page. Wraps
 * everything in `<SignedIn>` so anonymous visitors don't see it.
 */
export function ChatWidget({ studio }: ChatWidgetProps): JSX.Element {
  const [open, setOpen] = React.useState(false);
  return (
    <SignedIn>
      <button
        type="button"
        aria-label="Open chat with the studio assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
        style={{ backgroundColor: studio.primaryColor }}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden />
        )}
      </button>
      <ChatPanel studio={studio} open={open} onOpenChange={setOpen} />
    </SignedIn>
  );
}
