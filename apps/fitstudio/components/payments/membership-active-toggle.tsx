"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { fetchJson } from "@/lib/api-client";

interface MembershipActiveToggleProps {
  id: string;
  isActive: boolean;
}

export function MembershipActiveToggle({
  id,
  isActive,
}: MembershipActiveToggleProps): JSX.Element {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      fetchJson(`/api/memberships/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: next }),
      }),
    onSuccess: () => {
      toast.success("Plan updated");
      router.refresh();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  return (
    <Switch
      checked={isActive}
      disabled={mutation.isPending}
      onCheckedChange={(next) => mutation.mutate(next)}
      aria-label={isActive ? "Deactivate plan" : "Activate plan"}
      className="cursor-pointer"
    />
  );
}
