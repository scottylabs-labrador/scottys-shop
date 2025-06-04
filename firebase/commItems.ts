/** commItems.ts
 * Firebase operations for commission items
 * Handles CRUD operations for the commItems collection
 */

import { db } from "@/firebase/firebase";
import { getStorage, ref, deleteObject } from "firebase/storage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
} from "firebase/firestore";
import { AndrewID, CommissionItem, FirebaseID, ItemID } from "@/utils/types";

/**
 * Firebase Collection: commItems
 * {
 *   sellerId: AndrewID;
 *   title: string;
 *   description: string;
 *   price: number;
 *   category: string;
 *   tags: string[];
 *   isAvailable: boolean;
 *   images: string[];
 *   createdAt: number;
 * }
 */

// Add id to the type when returning from Firestore
export interface CommItemWithId extends CommissionItem {
  id: ItemID;
}

const commItemsCollection = collection(db, "commItems");
const storage = getStorage();

// Helper function to delete image from Firebase Storage
const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the Firebase Storage URL
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
    if (imageUrl.includes(baseUrl)) {
      // Parse the URL to get the file path
      const urlParts = imageUrl.split(baseUrl)[1];
      const bucketAndPath = urlParts.split("/o/")[1];
      const filePath = decodeURIComponent(bucketAndPath.split("?")[0]);

      const imageRef = ref(storage, filePath);
      await deleteObject(imageRef);
      console.log("Image deleted from storage:", filePath);
    }
  } catch (error) {
    // Don't throw error for image deletion failures to avoid breaking the main operation
    console.error("Error deleting image from storage:", error);
  }
};

// Helper function to delete multiple images from Firebase Storage
export const deleteImagesFromStorage = async (
  imageUrls: string[]
): Promise<void> => {
  const deletionPromises = imageUrls.map((url) => deleteImageFromStorage(url));
  await Promise.allSettled(deletionPromises); // Use allSettled to continue even if some fail
};

// Create a new commission item
export const createCommItem = async (
  itemData: Omit<CommissionItem, "id">
): Promise<ItemID> => {
  try {
    // Ensure isAvailable is set
    const completeItemData = {
      ...itemData,
      isAvailable:
        itemData.isAvailable !== undefined ? itemData.isAvailable : true,
    };

    const docRef = await addDoc(commItemsCollection, completeItemData);
    return docRef.id as ItemID;
  } catch (error) {
    console.error("Error creating commission item:", error);
    throw error;
  }
};

// Get a commission item by ID
export const getCommItemById = async (
  itemId: ItemID
): Promise<CommItemWithId | null> => {
  try {
    const itemDoc = await getDoc(doc(commItemsCollection, itemId));
    if (itemDoc.exists()) {
      return {
        id: itemDoc.id as ItemID,
        ...itemDoc.data(),
      } as CommItemWithId;
    }
    return null;
  } catch (error) {
    console.error("Error getting commission item:", error);
    throw error;
  }
};

// Get commission items by seller
export const getCommItemsBySeller = async (
  sellerId: AndrewID
): Promise<CommItemWithId[]> => {
  try {
    const q = query(commItemsCollection, where("sellerId", "==", sellerId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as CommItemWithId[];
  } catch (error) {
    console.error("Error getting items by seller:", error);
    throw error;
  }
};

// Get commission items by category
export const getCommItemsByCategory = async (
  category: string
): Promise<CommItemWithId[]> => {
  try {
    const q = query(
      commItemsCollection,
      where("category", "==", category),
      where("isAvailable", "==", true)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as CommItemWithId[];
  } catch (error) {
    console.error("Error getting items by category:", error);
    throw error;
  }
};

// Get commission items by price range
export const getCommItemsByPriceRange = async (
  minPrice: number,
  maxPrice: number
): Promise<CommItemWithId[]> => {
  try {
    const q = query(
      commItemsCollection,
      where("price", ">=", minPrice),
      where("price", "<=", maxPrice),
      where("isAvailable", "==", true)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as CommItemWithId[];
  } catch (error) {
    console.error("Error getting items by price range:", error);
    throw error;
  }
};

// Get available commission items
export const getAvailableCommItems = async (): Promise<CommItemWithId[]> => {
  try {
    const q = query(commItemsCollection, where("isAvailable", "==", true));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as CommItemWithId[];
  } catch (error) {
    console.error("Error getting available items:", error);
    throw error;
  }
};

// Update commission item
export const updateCommItem = async (
  itemId: ItemID,
  updates: Partial<CommissionItem>
): Promise<void> => {
  try {
    const itemRef = doc(commItemsCollection, itemId);
    await updateDoc(itemRef, updates);
  } catch (error) {
    console.error("Error updating commission item:", error);
    throw error;
  }
};

// Delete commission item (with image cleanup)
export const deleteCommItem = async (itemId: ItemID): Promise<void> => {
  try {
    // First get the item to access its images
    const itemData = await getCommItemById(itemId);

    if (itemData && itemData.images && itemData.images.length > 0) {
      // Delete all associated images from storage
      await deleteImagesFromStorage(itemData.images);
    }

    // Then delete the document
    await deleteDoc(doc(commItemsCollection, itemId));
  } catch (error) {
    console.error("Error deleting commission item:", error);
    throw error;
  }
};

// Update item availability
export const updateCommItemAvailability = async (
  itemId: ItemID,
  isAvailable: boolean
): Promise<void> => {
  try {
    const itemRef = doc(commItemsCollection, itemId);
    await updateDoc(itemRef, { isAvailable });
  } catch (error) {
    console.error("Error updating item availability:", error);
    throw error;
  }
};

// Get latest commission items
export const getLatestCommItems = async (
  limitCount: number = 10
): Promise<CommItemWithId[]> => {
  try {
    const queryConstraints: QueryConstraint[] = [
      where("isAvailable", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ];

    const q = query(commItemsCollection, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as CommItemWithId[];
  } catch (error) {
    console.error("Error getting latest items:", error);
    throw error;
  }
};
