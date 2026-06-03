import { getCurrentStudio } from "@/lib/tenant";
import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { StudioHeader } from "@/components/member/studio-header";

/**
 * Public member portal wrapper. Resolves the tenant once and shares it with
 * nested pages via header lookups.
 */
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const studio = await getCurrentStudio();

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
