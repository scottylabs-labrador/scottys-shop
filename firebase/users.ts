import { db } from '@/firebase/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Base User interface
export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  andrewId: string;
  clerkId: string;
  shopBanner?: string;
  shopTitle?: string;
  shopDescription?: string;
  favorites: string[];
  cart: string[];
  createdAt: number;
}

// User interface with ID
export interface UserWithId extends User {
  id: string;
}

const usersCollection = collection(db, 'users');

// Create a new user
export const createUser = async (userData: User): Promise<string> => {
  try {
    const docRef = await addDoc(usersCollection, userData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get a user by ID
export const getUserById = async (userId: string): Promise<UserWithId | null> => {
  try {
    const userDoc = await getDoc(doc(usersCollection, userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as UserWithId;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Get user by ClerkId
export const getUserByClerkId = async (clerkId: string): Promise<UserWithId | null> => {
  try {
    const q = query(usersCollection, where('clerkId', '==', clerkId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as UserWithId;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by clerkId:', error);
    throw error;
  }
};

// Get user by AndrewId
export const getUserByAndrewId = async (andrewId: string): Promise<UserWithId | null> => {
  try {
    const q = query(usersCollection, where('andrewId', '==', andrewId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as UserWithId;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by andrewId:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(usersCollection, userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Add to favorites
export const addToFavorites = async (userId: string, itemId: string): Promise<void> => {
  try {
    const userRef = doc(usersCollection, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const favorites = userData.favorites || [];
      if (!favorites.includes(itemId)) {
        await updateDoc(userRef, {
          favorites: [...favorites, itemId]
        });
      }
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

// Remove from favorites
export const removeFromFavorites = async (userId: string, itemId: string): Promise<void> => {
  try {
    const userRef = doc(usersCollection, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const favorites = userData.favorites || [];
      await updateDoc(userRef, {
        favorites: favorites.filter(id => id !== itemId)
      });
    }
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};


// Check if item is in cart using clerkId
export const isItemInCart = async (userId: string, itemId: string): Promise<boolean> => {
  try {
    const q = query(usersCollection, where("clerkId", "==", userId));
    const userDoc = (await getDocs(q)).docs[0];
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      return userData.cart.includes(itemId);
    }
    return false;
  } catch (error) {
    console.error('Error checking cart:', error);
    throw error;
  }
};

// Add to cart
export const addToCart = async (userId: string, itemId: string): Promise<void> => {
  try {
    const userRef = doc(usersCollection, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const cart = userData.cart || [];
      if (!cart.includes(itemId)) {
        await updateDoc(userRef, {
          cart: [...cart, itemId]
        });
      }
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Remove from cart
export const removeFromCart = async (userId: string, itemId: string): Promise<void> => {
  try {
    const userRef = doc(usersCollection, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const cart = userData.cart || [];
      await updateDoc(userRef, {
        cart: cart.filter(id => id !== itemId)
      });
    }
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};