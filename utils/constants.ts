/**
 * Base constants and shared utilities for the application
 * This file provides common patterns for status constants, display functions,
 * and type-safe lookups that are used across the application
 */

/**
 * Creates a type-safe mapping of constants
 * @param obj Object containing constant values
 * @returns The same object with better type safety
 */
export function createConstants<T extends Record<string, string>>(obj: T) {
  return obj as { readonly [K in keyof T]: T[K] };
}

/**
 * Creates helper functions for consistent handling of constants
 * @param constants Object containing constant values
 * @returns Object with utility functions for handling these constants
 */
export function createConstantHelpers<T extends Record<string, string>>(
  constants: T
) {
  return {
    // Get display text from key
    getDisplayText: (key: keyof typeof constants): string => constants[key],

    // Get key from value (reverse lookup)
    getKeyFromValue: (value: string): keyof typeof constants | undefined => {
      return Object.entries(constants).find(
        ([_, val]) => val === value
      )?.[0] as keyof typeof constants;
    },
  };
}
