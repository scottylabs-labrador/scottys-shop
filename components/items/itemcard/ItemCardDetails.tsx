"use client";

import Link from "next/link";
import { ITEM_TYPE, ITEM_CONDITIONS } from '@/utils/constants';

interface ItemCardDetailsProps {
  item: any;
  itemId: string;
  type: typeof ITEM_TYPE[keyof typeof ITEM_TYPE];
}

export default function ItemCardDetails({ 
  item, 
  itemId, 
  type 
}: ItemCardDetailsProps) {
  const isCommissionItem = (item: any): boolean => {
    return 'turnaroundDays' in item;
  };

  // Helper function to get condition display text from the constant
  const getConditionText = (conditionKey: string): string => {
    // Find matching display text in ITEM_CONDITIONS
    const conditionEntry = Object.entries(ITEM_CONDITIONS).find(
      ([key, _]) => key === conditionKey
    );
    
    return conditionEntry ? conditionEntry[1] : 'Unknown';
  };

  return (
    <Link href={`/item/${type.toLowerCase()}/${itemId}`}>
      <div className="p-3 space-y-1">
        <h3 className="text-md line-clamp-2">{item.title}</h3>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ${item.price.toFixed(2)}
          </span>

          {/* Show turnaround days for commission items, condition for marketplace items */}
          {isCommissionItem(item) ? (
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
              {item.turnaroundDays} {item.turnaroundDays === 1 ? 'day' : 'days'}
            </span>
          ) : (
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
              {getConditionText(item.condition)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}