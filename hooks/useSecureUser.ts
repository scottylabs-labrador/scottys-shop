import { AndrewID } from "@/utils/types";
import { SafeUserData } from "@/utils/types";

interface OwnUserData extends SafeUserData {
  favorites: string[];
}

export const useSecureUser = () => {
  // Get user by AndrewID (public data only)
  const getUserByAndrewId = async (
    andrewId: AndrewID
  ): Promise<SafeUserData | null> => {
    try {
      const response = await fetch(`/api/users/${andrewId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  };

  // Get current user's own data (includes favorites)
  const getCurrentUser = async (): Promise<OwnUserData | null> => {
    try {
      const response = await fetch("/api/users/current", { method: "POST" });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  };

  return {
    getUserByAndrewId,
    getCurrentUser,
  };
};

// Utility to safely extract AndrewID from various sources
export const extractAndrewId = (source: any): AndrewID | null => {
  if (typeof source === "string") return source as AndrewID;
  if (source?.andrewId) return source.andrewId as AndrewID;
  return null;
};
