/** SyncUserWithFirebase.tsx
 * Component to synchronize Clerk user data with Firebase
 * Ensures user data consistency between authentication and database
 */
"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function SyncUserWithFirebase() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Wait for Clerk to finish loading and ensure user exists
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      try {
        // Use the API endpoint for consistency
        const response = await fetch("/api/users/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          console.log("User sync successful");
        } else {
          console.error("User sync failed:", result.error);
        }
      } catch (error) {
        console.error("Error syncing user:", error);
      }
    };

    syncUser();
  }, [user, isLoaded]);

  return null;
}
