import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MPItemWithId } from "@/firebase/mpItems";
import { CommItemWithId } from "@/firebase/commItems";
import { Badge } from "@/components/ui/badge";
import { Tag, Clock } from "lucide-react";

// Type for item which can be either a marketplace item or commission item
type ItemType = MPItemWithId | CommItemWithId;

interface ItemPreviewProps {
  item: ItemType;
  itemType: "marketplace" | "commission";
}

const ItemPreview: React.FC<ItemPreviewProps> = ({ item, itemType }) => {
  if (!item) return null;

  // Determine the URL based on item type
  const itemUrl =
    itemType === "commission"
      ? `/item/commission/${item.id}`
      : `/item/marketplace/${item.id}`;

  // Determine category
  const categoryDisplay = item.category || "Uncategorized";

  // Determine secondary info based on item type
  const secondaryInfo =
    itemType === "commission"
      ? `${(item as CommItemWithId).turnaroundDays} day${
          (item as CommItemWithId).turnaroundDays !== 1 ? "s" : ""
        } turnaround`
      : `Condition: ${(item as MPItemWithId).condition}`;

  return (
    <Card className="mt-2 mb-4 overflow-hidden border border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg group">
      <Link href={itemUrl}>
        <CardContent className="p-0">
          <div className="flex h-full">
            {/* Item image with improved styling */}
            <div className="relative w-28 flex-shrink-0">
              {item.images && item.images.length > 0 ? (
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Type badge overlay */}
                  <div className="absolute top-2 left-2">
                    <Badge
                      className={`text-xs ${itemType === "commission" ? "bg-purple-500" : "bg-blue-500"}`}
                    >
                      {itemType === "commission" ? "Commission" : "Marketplace"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              )}
            </div>

            {/* Item details with improved typography and spacing */}
            <div className="flex-1 p-4">
              <h4 className="text-base font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h4>

              <div className="flex items-center mt-1.5 text-xs text-gray-500">
                <Tag className="h-3 w-3 mr-1.5" />
                <span>{categoryDisplay}</span>
              </div>

              <div className="flex items-center mt-1.5 text-xs text-gray-600">
                <Clock className="h-3 w-3 mr-1.5" />
                <span>{secondaryInfo}</span>
              </div>

              <p className="text-sm font-semibold text-blue-600 mt-2">
                ${item.price.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default ItemPreview;
