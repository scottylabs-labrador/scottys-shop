import { db } from "@/firebase/firebase";
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
import { MPITEM_STATUS } from "@/utils/ItemConstants";

interface MPItem {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  tags: string[];
  status: (typeof MPITEM_STATUS)[keyof typeof MPITEM_STATUS];
  images: string[];
  createdAt: number;
}

// Add id to the type when returning from Firestore
export interface MPItemWithId extends MPItem {
  id: string;
}

const mpItemsCollection = collection(db, "mpItems");

// Create a new marketplace item
export const createMPItem = async (itemData: MPItem): Promise<string> => {
  try {
    const docRef = await addDoc(mpItemsCollection, itemData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating marketplace item:", error);
    throw error;
  }
};

// Get a marketplace item by ID
export const getMPItemById = async (
  itemId: string
): Promise<MPItemWithId | null> => {
  try {
    const itemDoc = await getDoc(doc(mpItemsCollection, itemId));
    if (itemDoc.exists()) {
      return {
        id: itemDoc.id,
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
  sellerId: string
): Promise<MPItemWithId[]> => {
  try {
    const q = query(mpItemsCollection, where("sellerId", "==", sellerId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
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
      where("status", "==", MPITEM_STATUS.AVAILABLE)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
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
      where("status", "==", MPITEM_STATUS.AVAILABLE)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MPItemWithId[];
  } catch (error) {
    console.error("Error getting items by price range:", error);
    throw error;
  }
};

// Get marketplace items by status
export const getMPItemsByStatus = async (
  status: (typeof MPITEM_STATUS)[keyof typeof MPITEM_STATUS]
): Promise<MPItemWithId[]> => {
  try {
    const q = query(mpItemsCollection, where("status", "==", status));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MPItemWithId[];
  } catch (error) {
    console.error("Error getting items by status:", error);
    throw error;
  }
};

// Update marketplace item
export const updateMPItem = async (
  itemId: string,
  updates: Partial<MPItem>
): Promise<void> => {
  try {
    const itemRef = doc(mpItemsCollection, itemId);
    await updateDoc(itemRef, updates);
  } catch (error) {
    console.error("Error updating marketplace item:", error);
    throw error;
  }
};

// Delete marketplace item
export const deleteMPItem = async (itemId: string): Promise<void> => {
  try {
    await deleteDoc(doc(mpItemsCollection, itemId));
  } catch (error) {
    console.error("Error deleting marketplace item:", error);
    throw error;
  }
};

// Update item status
export const updateMPItemStatus = async (
  itemId: string,
  status: (typeof MPITEM_STATUS)[keyof typeof MPITEM_STATUS]
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
      where("status", "==", MPITEM_STATUS.AVAILABLE),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ];

    const q = query(mpItemsCollection, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MPItemWithId[];
  } catch (error) {
    console.error("Error getting latest items:", error);
    throw error;
  }
};
