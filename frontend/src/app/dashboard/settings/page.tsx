"use client";

/**
 * User-facing app settings for theme, animation behavior, and local data reset.
 */

import { useTheme } from "next-themes";
import { useAnimationContext } from "@/context/AnimationContext";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnimatedContainer } from "@/components/ui/AnimatedContainer";
import {
  Settings as SettingsIcon,
  Monitor,
  Activity,
  Palette,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { animationsEnabled, toggleAnimations } = useAnimationContext();
  const { clearStoredResults } = useAnalysis();
  const [clearMessage, setClearMessage] = useState<string>("");

  const handleClearStoredResults = () => {
    clearStoredResults();
    setClearMessage("All locally stored analysis results were deleted.");
  };

  return (
    <div className="space-y-6">
      <AnimatedContainer
        animation="fade-in"
        duration={0.2}
        className="border-b border-border pb-4"
      >
        <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          Agent Configuration
        </h1>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
          Manipulate UI rendering engines and display telemetry persistence.
        </p>
      </AnimatedContainer>

      <AnimatedContainer
        animation="slide-up"
        staggerChildren={0.05}
        className="max-w-3xl space-y-4"
      >
        {/* Theme Settings */}
        <div className="bg-card p-5 rounded-lg border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4 items-start">
            <div className="p-2 border border-border rounded-md bg-muted/50 hidden sm:block">
              <Palette className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Color Profiles
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
                Override universal appearance variables.
              </p>
            </div>
          </div>

          <div className="flex gap-1 bg-muted/50 p-1 rounded-md border border-border shrink-0">
            {["light", "dark", "system"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded capitalize transition-all",
                  theme === t
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Animation Engine Logics */}
        <div className="bg-card p-5 rounded-lg border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4 items-start">
            <div className="p-2 border border-border rounded-md bg-muted/50 hidden sm:block">
              <Monitor className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                GSAP Physics Renderer
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-70 leading-relaxed">
                Suspend timeline interpolations to maximize JS main-thread
                performance on low-compute terminals.
              </p>
            </div>
          </div>

          <button
            onClick={toggleAnimations}
            role="switch"
            aria-checked={animationsEnabled}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner",
              animationsEnabled ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <span className="sr-only">Toggle Engine</span>
            <span
              className={cn(
                "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                animationsEnabled ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
        </div>

        {/* Local Storage Cleanup */}
        <div className="bg-card p-5 rounded-lg border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4 items-start">
            <div className="p-2 border border-border rounded-md bg-muted/50 hidden sm:block">
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Local Results Storage
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[320px] leading-relaxed">
                Delete all locally stored analysis outputs, upload info, and
                recent history from this browser.
              </p>
              {clearMessage && (
                <p className="text-[11px] text-emerald-600 mt-2">
                  {clearMessage}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleClearStoredResults}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors shrink-0"
          >
            Delete Stored Results
          </button>
        </div>

        {/* Access Governance (Mock) */}
        {/* <div className="bg-muted/30 p-5 rounded-lg border border-border border-dashed flex flex-col md:flex-row md:items-center justify-between gap-6 opacity-80">
          <div className="flex gap-4 items-start">
            <div className="p-2 border border-border rounded-md bg-background hidden sm:block">
              <Shield className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Data Isolation{" "}
                <span className="text-[9px] bg-background px-1.5 py-0.5 rounded border border-border uppercase tracking-widest text-muted-foreground">
                  Enforced
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-70 leading-relaxed">
                VPC air-gap initialized. Zero-day retention deployed for upload
                buffer arrays.
              </p>
            </div>
          </div>
        </div> */}
      </AnimatedContainer>
    </div>
  );
}
