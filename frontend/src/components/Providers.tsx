"use client";

/**
 * Root client-side provider composition used by the app router layout.
 */

import { ThemeProvider } from "next-themes";
import { AnimationProvider } from "@/context/AnimationContext";
import { AnalysisProvider } from "@/context/AnalysisContext";

export function Providers({ children }: { children: React.ReactNode }) {
  // Order matters: theme wraps all UI, then animation, then analysis state.
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AnimationProvider>
        <AnalysisProvider>{children}</AnalysisProvider>
      </AnimationProvider>
    </ThemeProvider>
  );
}
