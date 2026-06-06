import { tryGetCurrentStudio } from "@/lib/tenant";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { StudioHeader } from "@/components/member/studio-header";

export const dynamic = "force-dynamic";

/**
 * Public member portal wrapper. Resolves the tenant once and shares it with
 * nested pages via header lookups. When the database hasn't been seeded yet
 * we render an explicit setup-needed screen rather than a generic 404 so
 * fresh deployments don't look broken.
 */
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const studio = await tryGetCurrentStudio();

  if (!studio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
        <h1 className="mb-2 text-2xl font-semibold">FitStudio is alive</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The deployment is healthy, but no studio matching the default slug{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">acme</code>{" "}
          exists in the database yet. Run the seed endpoint to create the demo
          tenant:
        </p>
        <code className="mt-3 block max-w-md break-all rounded bg-muted px-3 py-2 text-xs">
          GET /api/seed?token=&lt;SEED_TOKEN&gt;
        </code>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StudioHeader studio={studio} />
      <main className="container flex-1 py-8">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Powered by FitStudio · © {new Date().getFullYear()} {studio.name}
      </footer>
      <ChatWidget
        studio={{
          id: studio.id,
          name: studio.name,
          primaryColor: studio.primaryColor,
        }}
      />
    </div>
  );
}
