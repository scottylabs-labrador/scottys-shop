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
          favorites: [],
          cart: [],
          createdAt: Date.now()
        };

        if (existingUser) {
          // Update existing user
          await updateUser(existingUser.id, {
            name: existingUser.name,
            email: existingUser.email,
            avatarUrl: existingUser.avatarUrl,
          });
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