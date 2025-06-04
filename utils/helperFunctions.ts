/** helperFunctions.ts
 * Shared utility functions for the application
 * Contains common formatting and data transformation helpers
 */

/**
 * Format price with currency symbol and appropriate decimal places
 * @param price Number to format as currency
 * @param options Formatting options
 * @returns Formatted price string
 */
export const formatPrice = (
  price: number,
  options: {
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const {
    currency = "USD",
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(price);
};

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  if (!timestamp) return "recently";

  try {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, "second");
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), "month");
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), "year");
    }
  } catch (error) {
    // Fallback for older browsers
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }
};

/**
 * Check if an item is available based on its type and status
 * @param item The item to check
 * @param itemType The type of the item ("marketplace" or "commission")
 * @returns Boolean indicating if the item is available
 */
export const isItemAvailable = (
  item: any,
  itemType: "marketplace" | "commission"
): boolean => {
  if (!item) return false;

  if (itemType === "commission") {
    return !!item.isAvailable;
  } else {
    return item.status === "Available";
  }
};
