import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/firebase/users";
import {
  getCommItemById,
  updateCommItemAvailability,
} from "@/firebase/commItems";
import { getMPItemById, updateMPItemStatus } from "@/firebase/mpItems";
import { ITEM_TYPE } from "@/utils/itemConstants";
import { ClerkID, ItemID } from "@/utils/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId as ClerkID);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const itemType = params.type.toLowerCase();
    const itemId = params.id as ItemID;
    const body = await request.json();

    if (
      itemType !== ITEM_TYPE.COMMISSION.toLowerCase() &&
      itemType !== ITEM_TYPE.MARKETPLACE.toLowerCase()
    ) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    // Fetch item to verify ownership
    const isCommission = itemType === ITEM_TYPE.COMMISSION.toLowerCase();
    const item = isCommission
      ? await getCommItemById(itemId)
      : await getMPItemById(itemId);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify ownership
    if (item.sellerId !== user.andrewId) {
      return NextResponse.json(
        { error: "Unauthorized - not item owner" },
        { status: 403 }
      );
    }

    // Update status based on item type
    if (isCommission) {
      const { isAvailable } = body;
      if (typeof isAvailable !== "boolean") {
        return NextResponse.json(
          { error: "Invalid isAvailable value" },
          { status: 400 }
        );
      }
      await updateCommItemAvailability(itemId, isAvailable);
    } else {
      const { status } = body;
      if (!status) {
        return NextResponse.json(
          { error: "Status is required" },
          { status: 400 }
        );
      }
      await updateMPItemStatus(itemId, status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating item status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
