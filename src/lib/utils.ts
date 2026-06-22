import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fuehrt Tailwind-Klassen zusammen und loest Konflikte auf.
 * Standard-Helfer fuer alle shadcn/ui-Primitives.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
