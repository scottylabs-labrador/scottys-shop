/** contstantsHelper.ts
 * This file provides a utility function for creating and managing constant values in a type-safe manner.
 */

/**
 * Creates a type-safe mapping of constants
 * @param obj Object containing constant values
 * @returns The same object with better type safety
 */
export function createConstants<T extends Record<string, string>>(obj: T) {
  return obj as { readonly [K in keyof T]: T[K] };
}
