/** users.ts
 * Firebase operations for user management
 * Handles CRUD operations for the users collection
 */
import { db } from "@/firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { User, ClerkID, FirebaseID, AndrewID, ItemID } from "@/utils/types";

/**
 * Firebase Collection: users
 * {
 *   username: string;
 *   email: string;
 *   avatarUrl?: string;
 *   andrewId: AndrewID;
 *   clerkId: ClerkID;
 *   shopBanner?: string;
 *   shopTitle?: string;
 *   shopDescription?: string;
 *   starRating: number;
 *   paypalUsername?: string;
 *   venmoUsername?: string;
 *   zelleUsername?: string;
 *   cashappUsername?: string;
 *   favorites: ItemID[];
 *   createdAt: number;
 * }
 */

// User interface with ID
export interface UserWithId extends User {
  id: FirebaseID;
}

const usersCollection = collection(db, "users");

// Create a new user
export const createUser = async (
  userData: Omit<User, "favorites">
): Promise<FirebaseID> => {
  try {
    // Add empty array for favorites
    const fullUserData: User = {
      ...userData,
      favorites: [],
    };
    const docRef = await addDoc(usersCollection, fullUserData);
    return docRef.id as FirebaseID;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Get a user by ID
export const getUserById = async (
  userId: FirebaseID
): Promise<UserWithId | null> => {
  try {
    const userDoc = await getDoc(doc(usersCollection, userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id as FirebaseID,
        ...userDoc.data(),
      } as UserWithId;
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

// Get user by ClerkId
export const getUserByClerkId = async (
  clerkId: ClerkID
): Promise<UserWithId | null> => {
  try {
    const q = query(usersCollection, where("clerkId", "==", clerkId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id as FirebaseID,
        ...userDoc.data(),
      } as UserWithId;
    }
    return null;
  } catch (error) {
    console.error("Error getting user by clerkId:", error);
    throw error;
  }
};

// Get user by AndrewId
export const getUserByAndrewId = async (
  andrewId: AndrewID
): Promise<UserWithId | null> => {
  try {
    const q = query(usersCollection, where("andrewId", "==", andrewId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id as FirebaseID,
        ...userDoc.data(),
      } as UserWithId;
    }
    return null;
  } catch (error) {
    console.error("Error getting user by andrewId:", error);
    throw error;
  }
};

// Update user
export const updateUser = async (
  userId: FirebaseID,
  updates: Partial<User>
): Promise<void> => {
  try {
    const userRef = doc(usersCollection, userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Add to favorites
export const addToFavorites = async (
  userId: FirebaseID,
  itemId: ItemID
): Promise<void> => {
  try {
    const userRef = doc(usersCollection, userId);
    await updateDoc(userRef, {
      favorites: arrayUnion(itemId),
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    throw error;
  }
};

// Remove from favorites
export const removeFromFavorites = async (
  userId: FirebaseID,
  itemId: ItemID
): Promise<void> => {
  try {
    const userRef = doc(usersCollection, userId);
    await updateDoc(userRef, {
      favorites: arrayRemove(itemId),
    });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
};
