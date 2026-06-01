import { requireStaff } from "@/lib/auth";
import { getCurrentStudio } from "@/lib/tenant";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";

/**
 * Studio owner / staff dashboard shell. Layouts run on every request inside
 * the route group, so the role check here gates all nested pages.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const studio = await getCurrentStudio();
  await requireStaff();

  return (
    <div className="flex min-h-screen">
      <Sidebar studioName={studio.name} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar studio={studio} />
        <main className="flex-1 bg-muted/30 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
