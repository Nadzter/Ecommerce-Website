"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchJson } from "@/lib/api-client";

type Channel = "instagram_caption" | "whatsapp_broadcast" | "email";
type Lang = "es" | "en" | "ar";

const CHANNEL_LABEL: Record<Channel, string> = {
  instagram_caption: "Instagram caption",
  whatsapp_broadcast: "WhatsApp broadcast",
  email: "Email (subject + body)",
};

export function MarketingGenerator(): JSX.Element {
  const [prompt, setPrompt] = React.useState("");
  const [language, setLanguage] = React.useState<Lang>("es");
  const [channel, setChannel] = React.useState<Channel>(
    "instagram_caption",
  );
  const [output, setOutput] = React.useState<string>("");

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson<{ content: string }>("/api/generate-content", {
        method: "POST",
        body: JSON.stringify({
          prompt: prompt.trim(),
          language,
          channel,
        }),
      }),
    onSuccess: (data) => {
      setOutput(data.content);
      toast.success("Copy ready");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Generation failed"),
  });

  const copy = async (): Promise<void> => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What to promote</CardTitle>
          <CardDescription>
            One or two sentences about the offer, class, or campaign.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            maxLength={2000}
            placeholder="E.g. New Vinyasa Flow class every Tuesday at 7pm with a 20% intro discount for first-timers."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value as Lang)}
              >
                <SelectTrigger className="cursor-pointer transition-colors duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select
                value={channel}
                onValueChange={(value) => setChannel(value as Channel)}
              >
                <SelectTrigger className="cursor-pointer transition-colors duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram_caption">
                    {CHANNEL_LABEL.instagram_caption}
                  </SelectItem>
                  <SelectItem value="whatsapp_broadcast">
                    {CHANNEL_LABEL.whatsapp_broadcast}
                  </SelectItem>
                  <SelectItem value="email">
                    {CHANNEL_LABEL.email}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            disabled={!prompt.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="w-full cursor-pointer gap-2 transition-colors duration-200"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {mutation.isPending ? "Generating…" : "Generate"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base">Generated copy</CardTitle>
            <CardDescription>
              {CHANNEL_LABEL[channel]} in {language.toUpperCase()}.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!output}
            onClick={() => void copy()}
            className="cursor-pointer gap-2"
          >
            <Copy className="h-4 w-4" aria-hidden />
            Copy
          </Button>
        </CardHeader>
        <CardContent>
          {output ? (
            <pre
              dir={language === "ar" ? "rtl" : "ltr"}
              className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-sm leading-relaxed"
            >
              {output}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              Output will appear here once you generate copy.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
