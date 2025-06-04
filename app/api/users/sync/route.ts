import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId, createUser } from "@/firebase/users";
import { ClerkID, AndrewID, User } from "@/utils/types";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk (server-side)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from Clerk's backend API
    const clerkResponse = await fetch(
      `https://api.clerk.com/v1/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    if (!clerkResponse.ok) {
      throw new Error("Failed to fetch user from Clerk");
    }

    const clerkUser = await clerkResponse.json();

    // Check if user exists in Firebase
    const existingUser = await getUserByClerkId(userId as ClerkID);
    if (existingUser) {
      // User already exists, return success
      return NextResponse.json({ success: true, user: existingUser });
    }

    // Extract user data from Clerk response
    const email = clerkUser.email_addresses[0]?.email_address ?? "";
    const andrewId = email.split("@")[0] ?? "";

    // Create new user data that matches the User interface
    const userData: Omit<User, "favorites"> = {
      username: andrewId, // AndrewID is default username
      email,
      andrewId: andrewId as AndrewID,
      clerkId: userId as ClerkID,
      avatarUrl: "/assets/default-avatar.jpg",
      starRating: -1, // Default rating for new users
      createdAt: Date.now(),
      // Optional shop fields will be undefined initially
    };

    // Create user in Firebase (createUser will add empty favorites array)
    const firebaseUserId = await createUser(userData);

    // Return the created user data (without Firebase ID for security)
    const { clerkId, ...safeUserData } = userData;
    return NextResponse.json({
      success: true,
      user: {
        ...safeUserData,
        favorites: [], // Include empty favorites array in response
      },
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
  }
}
