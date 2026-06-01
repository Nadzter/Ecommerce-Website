import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

/**
 * Sidebar navigation for the studio owner dashboard. Each entry maps 1:1 to
 * a route segment under `app/(dashboard)`.
 */
export const dashboardNav: readonly NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview of bookings, revenue and active members.",
  },
  {
    label: "Classes",
    href: "/dashboard/classes",
    icon: CalendarDays,
    description: "Schedule, edit and cancel classes.",
  },
  {
    label: "Members",
    href: "/dashboard/members",
    icon: Users,
    description: "Manage member accounts and memberships.",
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    description: "Review payments, refunds and outstanding invoices.",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Studio profile, branding and tax configuration.",
  },
] as const;
