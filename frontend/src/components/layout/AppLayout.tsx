"use client";

import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200 selection:bg-primary/20 selection:text-primary">
      {/* Enterprise Stripe/Linear solid TopNav (no blur/glow) */}
      <TopNavbar />

      <div className="flex flex-1 pt-14">
        {/* Crisp Sidebar (w-64 desktop) */}
        <Sidebar className="hidden md:flex w-56 flex-col fixed left-0 top-14 bottom-0 border-r border-border bg-background" />
        
        <main className="flex-1 md:pl-56 bg-background overflow-hidden relative min-h-[calc(100vh-56px)]">
           <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
             <div className="max-w-7xl mx-auto w-full">
                {children}
             </div>
           </div>
        </main>
      </div>
    </div>
  );
}
