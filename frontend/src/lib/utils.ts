/** Shared utility helpers for className composition across components. */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  // Merge Tailwind classes deterministically after conditional expansion.
  return twMerge(clsx(inputs));
}
