"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

interface MembershipFormDialogProps {
  studioCurrency: "EUR" | "AED" | "USD" | "LBP";
}

interface FormState {
  name: string;
  description: string;
  type: "UNLIMITED" | "CLASS_PACK" | "DROP_IN";
  classCount: string;
  price: string;
  billingInterval: "MONTHLY" | "ANNUAL" | "ONE_TIME";
}

const DEFAULT_FORM: FormState = {
  name: "",
  description: "",
  type: "CLASS_PACK",
  classCount: "10",
  price: "100",
  billingInterval: "ONE_TIME",
};

export function MembershipFormDialog({
  studioCurrency,
}: MembershipFormDialogProps): JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);

  const mutation = useMutation({
    mutationFn: () =>
      fetchJson<{ membership: { id: string } }>("/api/memberships", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          type: form.type,
          classCount:
            form.type === "CLASS_PACK" ? Number(form.classCount) : null,
          price: Number(form.price),
          currency: studioCurrency,
          billingInterval: form.billingInterval,
        }),
      }),
    onSuccess: () => {
      toast.success("Plan created");
      queryClient.invalidateQueries({ queryKey: ["dashboard-memberships"] });
      router.refresh();
      setForm(DEFAULT_FORM);
      setOpen(false);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create"),
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer gap-2 transition-colors duration-200">
          <Plus className="h-4 w-4" aria-hidden />
          New plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create membership plan</DialogTitle>
          <DialogDescription>
            Plans appear in the public {`/membership`} page once activated.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.name.trim()) {
              toast.error("Name is required");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="plan-name">Name</Label>
            <Input
              id="plan-name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea
              id="plan-description"
              rows={3}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={2000}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) =>
                  update("type", value as FormState["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                  <SelectItem value="CLASS_PACK">Class pack</SelectItem>
                  <SelectItem value="DROP_IN">Drop-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Billing interval</Label>
              <Select
                value={form.billingInterval}
                onValueChange={(value) =>
                  update(
                    "billingInterval",
                    value as FormState["billingInterval"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_TIME">One-time</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-price">Price ({studioCurrency})</Label>
              <Input
                id="plan-price"
                type="number"
                min={0}
                step={studioCurrency === "LBP" ? 1 : 0.01}
                value={form.price}
                onChange={(event) => update("price", event.target.value)}
                required
              />
            </div>
            {form.type === "CLASS_PACK" ? (
              <div className="space-y-2">
                <Label htmlFor="plan-classes">Classes included</Label>
                <Input
                  id="plan-classes"
                  type="number"
                  min={1}
                  step={1}
                  value={form.classCount}
                  onChange={(event) => update("classCount", event.target.value)}
                  required
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setForm(DEFAULT_FORM);
                setOpen(false);
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="cursor-pointer"
            >
              {mutation.isPending ? "Creating…" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
