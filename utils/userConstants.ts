/** userConstants.ts
 * Constants and utilities for user-related functionality
 * Colors and other frontend metadata
 */
import { createConstants } from "@/utils/constantsHelper";
import {
  SiPaypal,
  SiVenmo,
  SiZelle,
  SiCashapp,
} from "@icons-pack/react-simple-icons";

// Payment platform types and their display information
export const PAYMENT_PLATFORMS = createConstants({
  PAYPAL: "paypal",
  VENMO: "venmo",
  ZELLE: "zelle",
  CASHAPP: "cashapp",
});

export const PAYMENT_PLATFORM_INFO = {
  [PAYMENT_PLATFORMS.PAYPAL]: {
    name: "PayPal",
    color: "bg-blue-500",
    textColor: "text-white",
    icon: SiPaypal,
  },
  [PAYMENT_PLATFORMS.VENMO]: {
    name: "Venmo",
    color: "bg-blue-600",
    textColor: "text-white",
    icon: SiVenmo,
  },
  [PAYMENT_PLATFORMS.ZELLE]: {
    name: "Zelle",
    color: "bg-purple-500",
    textColor: "text-white",
    icon: SiZelle,
  },
  [PAYMENT_PLATFORMS.CASHAPP]: {
    name: "Cash App",
    color: "bg-green-500",
    textColor: "text-white",
    icon: SiCashapp,
  },
} as const;

// Helper function to get available payment platforms from user data
export const getAvailablePaymentPlatforms = (user: {
  paypalUsername?: string;
  venmoUsername?: string;
  zelleUsername?: string;
  cashappUsername?: string;
}) => {
  const platforms = [];

  if (user.paypalUsername?.trim()) {
    platforms.push(PAYMENT_PLATFORMS.PAYPAL);
  }
  if (user.venmoUsername?.trim()) {
    platforms.push(PAYMENT_PLATFORMS.VENMO);
  }
  if (user.zelleUsername?.trim()) {
    platforms.push(PAYMENT_PLATFORMS.ZELLE);
  }
  if (user.cashappUsername?.trim()) {
    platforms.push(PAYMENT_PLATFORMS.CASHAPP);
  }

  return platforms;
};

// Check if user has at least one payment platform
export const hasPaymentPlatforms = (user: {
  paypalUsername?: string;
  venmoUsername?: string;
  zelleUsername?: string;
  cashappUsername?: string;
}) => {
  return getAvailablePaymentPlatforms(user).length > 0;
};
