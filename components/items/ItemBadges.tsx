/**
 * Badge components for displaying item properties
 * Provides consistent styling for status, type, condition and other item metadata
 */
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import {
  ITEM_STATUS,
  ITEM_TYPE,
  ITEM_CONDITIONS,
  statusColors,
  typeColors,
  conditionColors,
} from "@/utils/itemConstants";

// Type Badge component
export const TypeBadge = ({
  type,
}: {
  type: keyof typeof ITEM_TYPE | string;
}) => {
  // Handle case when passed a lowercase string (marketplace vs MARKETPLACE)
  const normalizedType = type.toUpperCase() as keyof typeof ITEM_TYPE;
  const displayType = ITEM_TYPE[normalizedType] || type;
  const colorClass = typeColors[displayType] || "bg-gray-100 text-gray-800";

  return <Badge className={colorClass}>{displayType}</Badge>;
};

// Status Badge component
export const StatusBadge = ({
  status,
}: {
  status: keyof typeof ITEM_STATUS | string;
}) => {
  // Normalize status if it's not already a key
  const normalizedStatus = Object.keys(ITEM_STATUS).includes(status)
    ? (status as keyof typeof ITEM_STATUS)
    : (Object.entries(ITEM_STATUS).find(
        ([_, val]) => val === status
      )?.[0] as keyof typeof ITEM_STATUS);

  const displayStatus = normalizedStatus
    ? ITEM_STATUS[normalizedStatus]
    : status;
  const colorClass =
    statusColors[displayStatus as keyof typeof statusColors] ||
    "bg-gray-100 text-gray-800";

  return <Badge className={colorClass}>{displayStatus}</Badge>;
};

// Condition Badge component
export const ConditionBadge = ({
  condition,
}: {
  condition: keyof typeof ITEM_CONDITIONS | string;
}) => {
  // Handle case when passed a value instead of a key
  const normalizedCondition = Object.keys(ITEM_CONDITIONS).includes(condition)
    ? (condition as keyof typeof ITEM_CONDITIONS)
    : (Object.entries(ITEM_CONDITIONS).find(
        ([_, val]) => val === condition
      )?.[0] as keyof typeof ITEM_CONDITIONS);

  const displayCondition = normalizedCondition
    ? ITEM_CONDITIONS[normalizedCondition]
    : condition;
  const colorClass =
    displayCondition in conditionColors
      ? conditionColors[displayCondition as keyof typeof conditionColors]
      : "bg-gray-100 text-gray-800";

  return <Badge className={colorClass}>{displayCondition}</Badge>;
};

// Availability Badge that handles both commission and marketplace items
export const AvailabilityBadge = ({
  isCommission,
  isAvailable,
  status,
}: {
  isCommission: boolean;
  isAvailable?: boolean;
  status?: string;
}) => {
  if (isCommission) {
    const displayStatus = isAvailable
      ? ITEM_STATUS.AVAILABLE
      : ITEM_STATUS.SOLD;
    const colorClass =
      statusColors[displayStatus as keyof typeof statusColors] ||
      "bg-gray-100 text-gray-800";

    return (
      <Badge className={colorClass}>
        {isAvailable ? "Available" : "Unavailable"}
      </Badge>
    );
  } else {
    return <StatusBadge status={status || ITEM_STATUS.AVAILABLE} />;
  }
};
