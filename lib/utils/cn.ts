// lib/utils/cn.ts
//ClassName utility — merges Tailwind classes cleanly.
// Prevents duplicate and conflicting class names.
// Use instead of string concatenation for conditional classes.

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
