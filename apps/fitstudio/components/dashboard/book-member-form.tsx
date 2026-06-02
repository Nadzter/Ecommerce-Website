"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/api-client";

interface BookableMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: "OWNER" | "STAFF" | "MEMBER";
}

interface BookingResponse {
  booking: {
    id: string;
    status: "CONFIRMED" | "WAITLISTED";
  };
}

interface BookMemberFormProps {
  classId: string;
  sessionType: "PRIVATE" | "DUET" | "TRIO";
  seatsLeft: number;
}

const SESSION_LABEL: Record<BookMemberFormProps["sessionType"], string> = {
  PRIVATE: "Private (1:1)",
  DUET: "Duet (up to 2)",
  TRIO: "Trio (up to 3)",
};

export function BookMemberForm({
  classId,
  sessionType,
  seatsLeft,
}: BookMemberFormProps): JSX.Element {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");

  // Debounce the search input so we don't refetch on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams({
      excludeClassId: classId,
      role: "MEMBER",
    });
    if (debouncedSearch.length > 0) params.set("q", debouncedSearch);
    return params.toString();
  }, [classId, debouncedSearch]);

  const membersQuery = useQuery({
    queryKey: ["bookable-members", classId, debouncedSearch],
    queryFn: () =>
      fetchJson<{ users: BookableMember[] }>(
        `/api/studios/me/members?${queryString}`,
      ),
  });

  const bookMutation = useMutation({
    mutationFn: (userId: string) =>
      fetchJson<BookingResponse>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ classId, userId }),
      }),
    onSuccess: (data) => {
      toast.success(
        data.booking.status === "WAITLISTED"
          ? "Added to waitlist"
          : "Member booked into session",
      );
      setSelectedUserId("");
      setSearch("");
      queryClient.invalidateQueries({ queryKey: ["class-detail", classId] });
      queryClient.invalidateQueries({
        queryKey: ["bookable-members", classId],
      });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Booking failed"),
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) {
      toast.error("Pick a member to book");
      return;
    }
    bookMutation.mutate(selectedUserId);
  };

  const members = membersQuery.data?.users ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Book a member</CardTitle>
        <CardDescription>
          {SESSION_LABEL[sessionType]} sessions are booked by the studio on
          behalf of the member.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {seatsLeft === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/30 p-3 text-center text-sm text-muted-foreground">
            All seats are taken. Cancel an existing booking to free a slot.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="member-search">Search</Label>
              <Input
                id="member-search"
                value={search}
                placeholder="Name or email"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Member</Label>
              {membersQuery.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No members match this search.
                </p>
              ) : (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => {
                      const name =
                        [member.firstName, member.lastName]
                          .filter(Boolean)
                          .join(" ") || member.email;
                      return (
                        <SelectItem key={member.id} value={member.id}>
                          {name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {member.email}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  !selectedUserId ||
                  bookMutation.isPending ||
                  members.length === 0
                }
              >
                {bookMutation.isPending ? "Booking..." : "Book member"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
