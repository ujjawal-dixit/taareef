// lib/utils/cn.ts
// className merging utility.
// Use instead of string concatenation for conditional classes.

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
