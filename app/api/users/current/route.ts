import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/firebase/users";
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

    // Return user data without sensitive IDs
    const safeUserData = {
      andrewId: user.andrewId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      shopBanner: user.shopBanner,
      shopTitle: user.shopTitle,
      shopDescription: user.shopDescription,
      starRating: user.starRating,
      paypalUsername: user.paypalUsername,
      venmoUsername: user.venmoUsername,
      zelleUsername: user.zelleUsername,
      cashappUsername: user.cashappUsername,
      favorites: user.favorites,
      createdAt: user.createdAt,
    };

    return NextResponse.json(safeUserData);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
