"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AnimationContextType {
  animationsEnabled: boolean;
  toggleAnimations: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  useEffect(() => {
    // Load preference from local storage on mount
    const stored = localStorage.getItem("animations_enabled");
    if (stored !== null) {
      setAnimationsEnabled(stored === "true");
    }
  }, []);

  const toggleAnimations = () => {
    setAnimationsEnabled((prev) => {
      const newVal = !prev;
      localStorage.setItem("animations_enabled", String(newVal));
      return newVal;
    });
  };

  return (
    <AnimationContext.Provider value={{ animationsEnabled, toggleAnimations }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimationContext() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error("useAnimationContext must be used within an AnimationProvider");
  }
  return context;
}
