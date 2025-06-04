import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getUserByClerkId,
  addToFavorites,
  removeFromFavorites,
} from "@/firebase/users";
import { ClerkID, ItemID } from "@/utils/types";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, action } = await request.json();

    if (!itemId || !action || (action !== "add" && action !== "remove")) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Get user's Firebase ID
    const user = await getUserByClerkId(clerkId as ClerkID);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Perform the favorite action
    if (action === "add") {
      await addToFavorites(user.id, itemId as ItemID);
    } else {
      await removeFromFavorites(user.id, itemId as ItemID);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating favorites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
