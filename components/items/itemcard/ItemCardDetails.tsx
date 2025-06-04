/**
 * Details section for item cards
 * Displays item information including price, condition, etc.
 */
"use client";
import Link from "next/link";
import {
  ITEM_TYPE,
  ITEM_CONDITIONS,
  conditionColors,
} from "@/utils/itemConstants";

interface ItemCardDetailsProps {
  item: any;
  itemId: string;
  type: (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];
}

export default function ItemCardDetails({
  item,
  itemId,
  type,
}: ItemCardDetailsProps) {
  // Render the condition badge consistently with ItemPage
  const renderConditionBadge = (condition: string) => {
    // First try to find if it's a key in ITEM_CONDITIONS
    let displayText: string =
      ITEM_CONDITIONS[condition as keyof typeof ITEM_CONDITIONS] || "";

    // If not found (meaning the condition might be a value instead of a key)
    if (!displayText) {
      // Check if the condition is already a display value
      if (Object.values(ITEM_CONDITIONS).includes(condition as any)) {
        displayText = condition;
      } else {
        displayText = "Unknown";
      }
    }

    // Get the appropriate color class - match how it's done in ItemBadges
    let colorClass = "text-blue-700 bg-blue-50"; // Default

    // Try to find the matching color from conditionColors
    Object.entries(ITEM_CONDITIONS).forEach(([key, value]) => {
      if (
        value === displayText &&
        conditionColors[value as keyof typeof conditionColors]
      ) {
        colorClass = conditionColors[value as keyof typeof conditionColors];
      }
    });

    return (
      <span
        className={`text-xs font-semibold px-2 py-1 rounded-full ${colorClass}`}
      >
        {displayText}
      </span>
    );
  };

  return (
    <Link href={`/item/${type.toLowerCase()}/${itemId}`}>
      <div className="p-3 space-y-1">
        <h3 className="text-md line-clamp-2">{item.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ${item.price.toFixed(2)}
          </span>
          {/* Show condition for marketplace items */}
          {type === ITEM_TYPE.MARKETPLACE &&
            renderConditionBadge(item.condition)}
        </div>
      </div>
    </Link>
  );
}
