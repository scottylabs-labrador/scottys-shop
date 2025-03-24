/**
 * Component to synchronize Clerk user data with Firebase
 * Ensures user data consistency between authentication and database
 */
"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { getUserByClerkId, createUser, updateUser } from "@/firebase/users";

export default function SyncUserWithFirebase() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const syncUser = async () => {
      try {
        // Check if user exists in Firebase
        const existingUser = await getUserByClerkId(user.id);

        const userData = {
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          email: user.emailAddresses[0]?.emailAddress ?? "",
          clerkId: user.id,
          avatarUrl: user.imageUrl,
          andrewId: user.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "",
          createdAt: Date.now(),
        };

        if (existingUser) {
          return;
        } else {
          // Create new user
          await createUser(userData);
        }
      } catch (error) {
        console.error("Error syncing user:", error);
      }
    };

    syncUser();
  }, [user]);

  return null;
}
