/** mpItems.ts
 * Firebase operations for marketplace items
 * Handles CRUD operations for the mpItems collection
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
import { MarketplaceItem, FirebaseID, ItemID, AndrewID } from "@/utils/types";
import { ITEM_STATUS } from "@/utils/itemConstants";

/**
 * Firebase Collection: mpItems
 * {
 *   sellerId: AndrewID;
 *   title: string;
 *   description: string;
 *   price: number;
 *   category: string;
 *   condition: string;
 *   tags: string[];
 *   status: string; // "Available", "Sold"
 *   images: string[];
 *   createdAt: number;
 * }
 */

// Add id to the type when returning from Firestore
export interface MPItemWithId extends MarketplaceItem {
  id: ItemID;
}

const mpItemsCollection = collection(db, "mpItems");
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

// Create a new marketplace item
export const createMPItem = async (
  itemData: Omit<MarketplaceItem, "id">
): Promise<ItemID> => {
  try {
    // Ensure status is set
    const completeItemData = {
      ...itemData,
      status: itemData.status || ITEM_STATUS.AVAILABLE,
    };

    const docRef = await addDoc(mpItemsCollection, completeItemData);
    return docRef.id as ItemID;
  } catch (error) {
    console.error("Error creating marketplace item:", error);
    throw error;
  }
};

// Get a marketplace item by ID
export const getMPItemById = async (
  itemId: ItemID
): Promise<MPItemWithId | null> => {
  try {
    const itemDoc = await getDoc(doc(mpItemsCollection, itemId));
    if (itemDoc.exists()) {
      return {
        id: itemDoc.id as ItemID,
        ...itemDoc.data(),
      } as MPItemWithId;
    }
    return null;
  } catch (error) {
    console.error("Error getting marketplace item:", error);
    throw error;
  }
};

// Get marketplace items by seller
export const getMPItemsBySeller = async (
  sellerId: AndrewID
): Promise<MPItemWithId[]> => {
  try {
    const q = query(mpItemsCollection, where("sellerId", "==", sellerId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as MPItemWithId[];
  } catch (error) {
    console.error("Error getting items by seller:", error);
    throw error;
  }
};

// Get marketplace items by category
export const getMPItemsByCategory = async (
  category: string
): Promise<MPItemWithId[]> => {
  try {
    const q = query(
      mpItemsCollection,
      where("category", "==", category),
      where("status", "==", ITEM_STATUS.AVAILABLE)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as MPItemWithId[];
  } catch (error) {
    console.error("Error getting items by category:", error);
    throw error;
  }
};

// Get marketplace items by price range
export const getMPItemsByPriceRange = async (
  minPrice: number,
  maxPrice: number
): Promise<MPItemWithId[]> => {
  try {
    const q = query(
      mpItemsCollection,
      where("price", ">=", minPrice),
      where("price", "<=", maxPrice),
      where("status", "==", ITEM_STATUS.AVAILABLE)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as MPItemWithId[];
  } catch (error) {
    console.error("Error getting items by price range:", error);
    throw error;
  }
};

// Get marketplace items by status
export const getMPItemsByStatus = async (
  status: (typeof ITEM_STATUS)[keyof typeof ITEM_STATUS]
): Promise<MPItemWithId[]> => {
  try {
    const q = query(mpItemsCollection, where("status", "==", status));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as MPItemWithId[];
  } catch (error) {
    console.error("Error getting items by status:", error);
    throw error;
  }
};

// Update marketplace item
export const updateMPItem = async (
  itemId: ItemID,
  updates: Partial<MarketplaceItem>
): Promise<void> => {
  try {
    const itemRef = doc(mpItemsCollection, itemId);
    await updateDoc(itemRef, updates);
  } catch (error) {
    console.error("Error updating marketplace item:", error);
    throw error;
  }
};

// Delete marketplace item (with image cleanup)
export const deleteMPItem = async (itemId: ItemID): Promise<void> => {
  try {
    // First get the item to access its images
    const itemData = await getMPItemById(itemId);

    if (itemData && itemData.images && itemData.images.length > 0) {
      // Delete all associated images from storage
      await deleteImagesFromStorage(itemData.images);
    }

    // Then delete the document
    await deleteDoc(doc(mpItemsCollection, itemId));
  } catch (error) {
    console.error("Error deleting marketplace item:", error);
    throw error;
  }
};

// Update item status
export const updateMPItemStatus = async (
  itemId: ItemID,
  status: (typeof ITEM_STATUS)[keyof typeof ITEM_STATUS]
): Promise<void> => {
  try {
    const itemRef = doc(mpItemsCollection, itemId);
    await updateDoc(itemRef, { status });
  } catch (error) {
    console.error("Error updating item status:", error);
    throw error;
  }
};

// Get latest marketplace items
export const getLatestMPItems = async (
  limitCount: number = 10
): Promise<MPItemWithId[]> => {
  try {
    const queryConstraints: QueryConstraint[] = [
      where("status", "==", ITEM_STATUS.AVAILABLE),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ];

    const q = query(mpItemsCollection, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id as ItemID,
      ...doc.data(),
    })) as MPItemWithId[];
  } catch (error) {
    console.error("Error getting latest items:", error);
    throw error;
  }
};
