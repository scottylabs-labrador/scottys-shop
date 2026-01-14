import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByAndrewId, getUserByClerkId } from "@/firebase/users";
import { AndrewID, ClerkID, SafeUserData, User } from "@/utils/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ andrewId: string }> }
) {
  try {
    const resolvedParams = await params;
    const andrewId = resolvedParams.andrewId as AndrewID;

    // Get target user by AndrewID
    const targetUser = await getUserByAndrewId(andrewId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return only safe data (no ClerkID, FirebaseID, or favorites)
    const safeUserData: SafeUserData = {
      andrewId: targetUser.andrewId,
      username: targetUser.username,
      email: targetUser.email,
      avatarUrl: targetUser.avatarUrl,
      shopBanner: targetUser.shopBanner,
      shopTitle: targetUser.shopTitle,
      shopDescription: targetUser.shopDescription,
      starRating: targetUser.starRating,
      paypalUsername: targetUser.paypalUsername,
      venmoUsername: targetUser.venmoUsername,
      zelleUsername: targetUser.zelleUsername,
      cashappUsername: targetUser.cashappUsername,
      createdAt: targetUser.createdAt,
    };

    return NextResponse.json(safeUserData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
