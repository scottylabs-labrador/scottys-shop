import { db } from '@/firebase/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, QueryConstraint } from 'firebase/firestore';

interface CommItem {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  turnaroundDays: number;
  isAvailable: boolean;
  images: string[];
  createdAt: number;
}

// Add id to the type when returning from Firestore
export interface CommItemWithId extends CommItem {
  id: string;
}

const commItemsCollection = collection(db, 'commItems');

// Create a new commission item
export const createCommItem = async (itemData: CommItem): Promise<string> => {
  try {
    const docRef = await addDoc(commItemsCollection, itemData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating commission item:', error);
    throw error;
  }
};

// Get a commission item by ID
export const getCommItemById = async (itemId: string): Promise<CommItemWithId | null> => {
  try {
    const itemDoc = await getDoc(doc(commItemsCollection, itemId));
    if (itemDoc.exists()) {
      return {
        id: itemDoc.id,
        ...itemDoc.data()
      } as CommItemWithId;
    }
    return null;
  } catch (error) {
    console.error('Error getting commission item:', error);
    throw error;
  }
};

// Get commission items by seller
export const getCommItemsBySeller = async (sellerId: string): Promise<CommItemWithId[]> => {
  try {
    const q = query(commItemsCollection, where('sellerId', '==', sellerId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommItemWithId[];
  } catch (error) {
    console.error('Error getting items by seller:', error);
    throw error;
  }
};

// Get commission items by category
export const getCommItemsByCategory = async (category: string): Promise<CommItemWithId[]> => {
  try {
    const q = query(
      commItemsCollection, 
      where('category', '==', category),
      where('isAvailable', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommItemWithId[];
  } catch (error) {
    console.error('Error getting items by category:', error);
    throw error;
  }
};

// Get commission items by price range
export const getCommItemsByPriceRange = async (minPrice: number, maxPrice: number): Promise<CommItemWithId[]> => {
  try {
    const q = query(
      commItemsCollection,
      where('price', '>=', minPrice),
      where('price', '<=', maxPrice),
      where('isAvailable', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommItemWithId[];
  } catch (error) {
    console.error('Error getting items by price range:', error);
    throw error;
  }
};

// Get available commission items
export const getAvailableCommItems = async (): Promise<CommItemWithId[]> => {
  try {
    const q = query(commItemsCollection, where('isAvailable', '==', true));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommItemWithId[];
  } catch (error) {
    console.error('Error getting available items:', error);
    throw error;
  }
};

// Update commission item
export const updateCommItem = async (itemId: string, updates: Partial<CommItem>): Promise<void> => {
  try {
    const itemRef = doc(commItemsCollection, itemId);
    await updateDoc(itemRef, updates);
  } catch (error) {
    console.error('Error updating commission item:', error);
    throw error;
  }
};

// Delete commission item
export const deleteCommItem = async (itemId: string): Promise<void> => {
  try {
    await deleteDoc(doc(commItemsCollection, itemId));
  } catch (error) {
    console.error('Error deleting commission item:', error);
    throw error;
  }
};

// Update item availability
export const updateCommItemAvailability = async (itemId: string, isAvailable: boolean): Promise<void> => {
  try {
    const itemRef = doc(commItemsCollection, itemId);
    await updateDoc(itemRef, { isAvailable });
  } catch (error) {
    console.error('Error updating item availability:', error);
    throw error;
  }
};

// Get latest commission items
export const getLatestCommItems = async (limitCount: number = 10): Promise<CommItemWithId[]> => {
  try {
    const queryConstraints: QueryConstraint[] = [
      where('isAvailable', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];

    const q = query(commItemsCollection, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommItemWithId[];
  } catch (error) {
    console.error('Error getting latest items:', error);
    throw error;
  }
};

// Get commission items by turnaround time
export const getCommItemsByTurnaroundTime = async (maxDays: number): Promise<CommItemWithId[]> => {
  try {
    const q = query(
      commItemsCollection,
      where('turnaroundDays', '<=', maxDays),
      where('isAvailable', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CommItemWithId[];
  } catch (error) {
    console.error('Error getting items by turnaround time:', error);
    throw error;
  }
};