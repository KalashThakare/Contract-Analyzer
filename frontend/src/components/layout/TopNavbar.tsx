"use client";

import { useTheme } from "next-themes";
import { useAnimationContext } from "@/context/AnimationContext";
import { Moon, Sun, Scale, Search, Bell, Activity, ActivitySquare, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const { animationsEnabled, toggleAnimations } = useAnimationContext();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b border-border bg-background z-50 transition-colors duration-200 px-4 md:px-6 flex items-center justify-between">
      
      {/* Left: Branding */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center border border-border">
           <Scale className="w-4 h-4 text-background" strokeWidth={2} />
        </div>
        <div>
           <span className="font-semibold text-sm tracking-tight text-foreground block leading-none">Aethel AI</span>
           <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-medium mt-1">Legal Inference Platform</span>
        </div>
      </div>

      {/* Center: Global Search (Mock) */}
      <div className="hidden md:flex flex-1 max-w-xl mx-8">
        <div className="relative w-full group">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
           <input 
             type="text" 
             placeholder="Search contracts, clauses, or entities (Press '/')" 
             className="w-full h-8 bg-muted/50 border border-border rounded-md pl-9 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
           />
           <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono font-medium text-muted-foreground">⌘K</kbd>
           </div>
        </div>
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        
        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
           <span className="relative flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
           </span>
           <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">VPC Node 401 Active</span>
        </div>

        <div className="w-px h-4 bg-border mx-2 hidden sm:block" />

        {/* Global Animation Toggle */}
        <button 
           onClick={toggleAnimations}
           className="w-7 h-7 rounded-sm flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
           aria-label="Toggle Physics/Animations"
        >
          {animationsEnabled ? <Activity className="w-4 h-4" /> : <ActivitySquare className="w-4 h-4" />}
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-7 h-7 rounded-sm flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
           <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
           <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>

        <button className="relative w-7 h-7 rounded-sm flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
           <Bell className="w-4 h-4" />
           <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-background"></span>
        </button>

        <div className="w-7 h-7 bg-muted rounded-md border border-border overflow-hidden cursor-pointer flex items-center justify-center ml-2">
           <span className="text-xs font-bold text-muted-foreground">AD</span>
        </div>
      </div>
    </header>
  );
}
