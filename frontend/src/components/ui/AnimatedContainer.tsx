"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAnimationContext } from "@/context/AnimationContext";
import { cn } from "@/lib/utils";

interface AnimatedContainerProps {
  children: React.ReactNode;
  animation?: "fade-in" | "slide-up";
  delay?: number;
  duration?: number;
  className?: string;
  staggerChildren?: number;
}

export function AnimatedContainer({ 
  children, 
  animation = "fade-in", 
  delay = 0, 
  duration = 0.15, // Enterprise speeds (150ms)
  className,
  staggerChildren = 0
}: AnimatedContainerProps) {
  const container = useRef<HTMLDivElement>(null);
  const { animationsEnabled } = useAnimationContext();

  useGSAP(() => {
    if (!animationsEnabled || !container.current) return;
    const el = container.current;
    
    gsap.set(el, { clearProps: "all" });

    // Strict non-bouncy presets
    const vars: gsap.TweenVars = {
      opacity: 0,
      duration,
      delay,
      ease: "power2.out"
    };

    if (animation === "slide-up") {
      vars.y = 8; // Very subtle 8px slide
    }

    if (staggerChildren > 0) {
      gsap.from(el.children, {
        ...vars,
        stagger: staggerChildren,
      });
    } else {
      gsap.from(el, vars);
    }
  }, { dependencies: [animationsEnabled, animation], scope: container });

  return (
    <div ref={container} className={cn(className, !animationsEnabled && "opacity-100")}>
      {children}
    </div>
  );
}
