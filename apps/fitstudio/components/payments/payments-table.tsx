"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { initials } from "@/lib/utils";

export interface PaymentRow {
  id: string;
  status: "PENDING" | "COMPLETED" | "REFUNDED" | "FAILED";
  amount: string;
  currency: "EUR" | "AED" | "USD" | "LBP";
  createdAt: string;
  description: string | null;
  invoiceUrl: string | null;
  user: { firstName: string | null; lastName: string | null; email: string };
  membership: { name: string | null } | null;
}

const statusVariant: Record<PaymentRow["status"], "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  COMPLETED: "default",
  REFUNDED: "secondary",
  FAILED: "destructive",
};

interface PaymentsTableProps {
  rows: readonly PaymentRow[];
}

export function PaymentsTable({ rows }: PaymentsTableProps): JSX.Element {
  const [status, setStatus] = React.useState<string>("all");

  const filtered = React.useMemo(
    () =>
      status === "all"
        ? rows
        : rows.filter((row) => row.status === status),
    [rows, status],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Recent payments</h2>
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {rows.length} payments.
          </p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No payments match this filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const name =
                  [row.user.firstName, row.user.lastName]
                    .filter(Boolean)
                    .join(" ") || row.user.email;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {initials(row.user.firstName, row.user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.membership?.name ?? row.description ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatCurrency(row.amount, row.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.invoiceUrl ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="cursor-pointer"
                          aria-label="Download invoice"
                        >
                          <a
                            href={row.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
