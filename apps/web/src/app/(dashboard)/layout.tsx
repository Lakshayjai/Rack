import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { GenderPrompt } from "@/components/layout/GenderPrompt";

/** Authenticated dashboard shell: sidebar + topbar + scrollable main + mobile bottom nav. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-bg-primary">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">{children}</main>
        </div>
        <BottomNav />
        <GenderPrompt />
      </div>
    </AuthGuard>
  );
}
