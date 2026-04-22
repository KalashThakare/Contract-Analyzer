/**
 * Shared dashboard shell that wraps all dashboard subroutes with app chrome.
 */

import { AppLayout } from "@/components/layout/AppLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
