import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/firebase/users";
import { createCommItem } from "@/firebase/commItems";
import { createMPItem } from "@/firebase/mpItems";
import { ITEM_STATUS } from "@/utils/itemConstants";
import { ClerkID } from "@/utils/types";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId as ClerkID);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      price,
      category,
      tags,
      images,
      condition,
    } = body;

    if (!type || (type !== "marketplace" && type !== "commission")) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    // Validate required fields
    if (
      !title ||
      !description ||
      !price ||
      !category ||
      !images ||
      images.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create item data
    const baseItemData = {
      sellerId: user.andrewId,
      title,
      description,
      price: Number(price),
      category,
      tags: tags || [],
      images,
      createdAt: Date.now(),
    };

    let itemId: string;

    if (type === "marketplace") {
      if (!condition) {
        return NextResponse.json(
          { error: "Condition required for marketplace items" },
          { status: 400 }
        );
      }

      const marketplaceData = {
        ...baseItemData,
        condition,
        status: ITEM_STATUS.AVAILABLE,
      };
      itemId = await createMPItem(marketplaceData);
    } else {
      const commissionData = {
        ...baseItemData,
        isAvailable: true,
      };
      itemId = await createCommItem(commissionData);
    }

    return NextResponse.json({ success: true, itemId });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
