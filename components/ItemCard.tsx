"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, Tag } from "lucide-react";
import {
  MPITEM_STATUS,
  ITEM_TYPE,
  type ItemType,
  type AnyItem,
  isCommissionItem,
} from "@/convex/constants";

// Separate components for each item type
function CommissionItemCard({ itemId }: { itemId: Id<"commItems"> }) {
  const item = useQuery(api.commItems.getById, { itemId });
  if (!item) return null;
  return (
    <ItemCardContent item={item} type={ITEM_TYPE.COMMISSION} itemId={itemId} />
  );
}

function MarketplaceItemCard({ itemId }: { itemId: Id<"mpItems"> }) {
  const item = useQuery(api.mpItems.getById, { itemId });
  if (!item) return null;
  return (
    <ItemCardContent item={item} type={ITEM_TYPE.MARKETPLACE} itemId={itemId} />
  );
}

// Common content component
function ItemCardContent({
  item,
  type,
  itemId,
}: {
  item: AnyItem;
  type: ItemType;
  itemId: Id<"commItems"> | Id<"mpItems">;
}) {
  const router = useRouter();
  const status = isCommissionItem(item) ? item.isAvailable : item.status;
  const statusText = isCommissionItem(item)
    ? item.isAvailable
      ? "Available"
      : "Unavailable"
    : item.status.charAt(0).toUpperCase() + item.status.slice(1);

  const handleClick = () => {
    router.push(`/items/${type}/${itemId}`);
  };

  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          </div>
          <Badge
            variant={
              status === MPITEM_STATUS.AVAILABLE ||
              (isCommissionItem(item) && item.isAvailable)
                ? "default"
                : "secondary"
            }
          >
            {statusText}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${item.price.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span>{item.category}</span>
          </div>

          {isCommissionItem(item) && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{item.turnaroundDays} days turnaround</span>
            </div>
          )}

          {!isCommissionItem(item) && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{item.condition}</Badge>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <div className="w-full flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{item.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardFooter>

      <div className="p-4 border-t">
        <Button
          onClick={handleClick}
          className="w-full"
          variant={
            status === MPITEM_STATUS.AVAILABLE ||
            (isCommissionItem(item) && item.isAvailable)
              ? "default"
              : "secondary"
          }
        >
          View Details
        </Button>
      </div>
    </Card>
  );
}

// Main ItemCard component that renders the appropriate card based on type
function ItemCard({
  itemId,
  type,
}: {
  itemId: Id<"commItems"> | Id<"mpItems">;
  type: ItemType;
}) {
  if (type === ITEM_TYPE.COMMISSION) {
    return <CommissionItemCard itemId={itemId as Id<"commItems">} />;
  } else {
    return <MarketplaceItemCard itemId={itemId as Id<"mpItems">} />;
  }
}

export default ItemCard;
