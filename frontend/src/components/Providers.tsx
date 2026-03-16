"use client";

import { ThemeProvider } from "next-themes";
import { AnimationProvider } from "@/context/AnimationContext";
import { AnalysisProvider } from "@/context/AnalysisContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AnimationProvider>
        <AnalysisProvider>{children}</AnalysisProvider>
      </AnimationProvider>
    </ThemeProvider>
  );
}
