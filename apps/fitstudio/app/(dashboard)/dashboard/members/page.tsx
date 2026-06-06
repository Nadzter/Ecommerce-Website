import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentStudio } from "@/lib/tenant";

export const metadata: Metadata = { title: "Members" };

export const dynamic = "force-dynamic";

export default async function MembersPage(): Promise<JSX.Element> {
  const studio = await getCurrentStudio();
  const members = await prisma.user.findMany({
    where: { studioId: studio.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          People registered with {studio.name}.
        </p>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No members yet</CardTitle>
            <CardDescription>
              Invite members from Clerk or share the public booking page so
              visitors can sign themselves up.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Roster</CardTitle>
            <CardDescription>
              Showing the {members.length} most recently created accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {members.map((member) => {
                const displayName =
                  [member.firstName, member.lastName]
                    .filter(Boolean)
                    .join(" ") || member.email;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{displayName}</p>
                      <p className="text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge
                      variant={
                        member.role === "OWNER"
                          ? "default"
                          : member.role === "STAFF"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {member.role}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
