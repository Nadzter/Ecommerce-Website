import type { Metadata } from "next";

import { MarketingGenerator } from "@/components/chatbot/marketing-generator";
import { requireOwner } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/tenant";

export const metadata: Metadata = { title: "Marketing" };

export const dynamic = "force-dynamic";

export default async function MarketingPage(): Promise<JSX.Element> {
  await requireOwner();
  const studio = await getCurrentStudio();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketing</h1>
        <p className="text-sm text-muted-foreground">
          Generate Instagram captions, WhatsApp broadcasts, and email copy
          for {studio.name} in any supported language.
        </p>
      </div>

      <MarketingGenerator />
    </div>
  );
}
