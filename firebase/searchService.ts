/**
 * Search service for querying items across collections
 * Provides functionality to search and filter items from both marketplace and commission collections
 */

import { db } from "@/firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  QueryConstraint,
} from "firebase/firestore";
import {
  SearchResult,
  SearchFilters,
  ItemID,
  FirebaseID,
  AndrewID,
} from "@/utils/types";
import { ITEM_STATUS } from "@/utils/itemConstants";

/**
 * Search for items across both marketplace and commission collections
 */
export const searchItems = async (
  searchQuery: string,
  filters: SearchFilters = {},
  itemLimit: number = 40
): Promise<SearchResult[]> => {
  try {
    const searchQueryLower = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Fetch marketplace items
    if (!filters.type || filters.type === "marketplace") {
      const mpItemsCollection = collection(db, "mpItems");
      const mpConstraints: QueryConstraint[] = [
        where("status", "==", ITEM_STATUS.AVAILABLE),
        orderBy("createdAt", "desc"),
        firestoreLimit(itemLimit),
      ];

      const mpQuery = query(mpItemsCollection, ...mpConstraints);
      const mpSnapshot = await getDocs(mpQuery);

      mpSnapshot.forEach((doc) => {
        const data = doc.data();

        const matchesSearch =
          data.title?.toLowerCase().includes(searchQueryLower) ||
          data.description?.toLowerCase().includes(searchQueryLower) ||
          data.tags?.some((tag: string) =>
            tag.toLowerCase().includes(searchQueryLower)
          );

        const matchesFilters =
          (!filters.category || data.category === filters.category) &&
          (typeof filters.minPrice !== "number" ||
            data.price >= filters.minPrice) &&
          (typeof filters.maxPrice !== "number" ||
            data.price <= filters.maxPrice) &&
          (!filters.condition || data.condition === filters.condition);

        if (matchesSearch && matchesFilters) {
          results.push({
            id: doc.id as ItemID,
            type: "marketplace",
            title: data.title || "",
            description: data.description || "",
            price: data.price || 0,
            category: data.category || "",
            sellerId: data.sellerId as AndrewID,
            images: data.images || [],
            status: data.status || "",
            condition: data.condition || "",
            createdAt: data.createdAt || Date.now(),
            tags: data.tags || [],
          });
        }
      });
    }

    // Fetch commission items
    if (!filters.type || filters.type === "commission") {
      const commItemsCollection = collection(db, "commItems");
      const commConstraints: QueryConstraint[] = [
        where("isAvailable", "==", true),
        orderBy("createdAt", "desc"),
        firestoreLimit(itemLimit),
      ];

      const commQuery = query(commItemsCollection, ...commConstraints);
      const commSnapshot = await getDocs(commQuery);

      commSnapshot.forEach((doc) => {
        const data = doc.data();

        const matchesSearch =
          data.title?.toLowerCase().includes(searchQueryLower) ||
          data.description?.toLowerCase().includes(searchQueryLower) ||
          data.tags?.some((tag: string) =>
            tag.toLowerCase().includes(searchQueryLower)
          );

        const matchesFilters =
          (!filters.category || data.category === filters.category) &&
          (typeof filters.minPrice !== "number" ||
            data.price >= filters.minPrice) &&
          (typeof filters.maxPrice !== "number" ||
            data.price <= filters.maxPrice);

        if (matchesSearch && matchesFilters) {
          results.push({
            id: doc.id as ItemID,
            type: "commission",
            title: data.title || "",
            description: data.description || "",
            price: data.price || 0,
            category: data.category || "",
            sellerId: data.sellerId as AndrewID,
            images: data.images || [],
            isAvailable: data.isAvailable || false,
            createdAt: data.createdAt || Date.now(),
            tags: data.tags || [],
          });
        }
      });
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error searching items:", error);
    throw error;
  }
};

/**
 * Filter search results using client-side filtering
 */
export const filterSearchResults = (
  results: SearchResult[],
  filters: SearchFilters
): SearchResult[] => {
  return results.filter((item) => {
    if (filters.type && item.type !== filters.type) {
      return false;
    }

    if (typeof filters.minPrice === "number" && item.price < filters.minPrice) {
      return false;
    }

    if (typeof filters.maxPrice === "number" && item.price > filters.maxPrice) {
      return false;
    }

    if (filters.category && item.category !== filters.category) {
      return false;
    }

    if (
      filters.condition &&
      item.type === "marketplace" &&
      item.condition !== filters.condition
    ) {
      return false;
    }

    return true;
  });
};

/**
 * Get similar items based on category and tags
 */
export const getSimilarItems = async (
  itemId: ItemID,
  itemType: "marketplace" | "commission",
  category: string,
  tags: string[],
  limit: number = 8
): Promise<SearchResult[]> => {
  try {
    const collectionName = itemType === "marketplace" ? "mpItems" : "commItems";
    const itemsCollection = collection(db, collectionName);

    const constraints: QueryConstraint[] = [
      where("category", "==", category),
      itemType === "marketplace"
        ? where("status", "==", ITEM_STATUS.AVAILABLE)
        : where("isAvailable", "==", true),
      orderBy("createdAt", "desc"),
      firestoreLimit(20),
    ];

    const itemsQuery = query(itemsCollection, ...constraints);
    const snapshot = await getDocs(itemsQuery);

    const results: Array<SearchResult & { _relevanceScore: number }> = [];

    snapshot.forEach((doc) => {
      if (doc.id === itemId) return;

      const data = doc.data();
      const itemTags = data.tags || [];
      const matchingTagsCount = itemTags.filter((tag: string) =>
        tags.includes(tag)
      ).length;

      const result: SearchResult & { _relevanceScore: number } = {
        id: doc.id as ItemID,
        type: itemType,
        title: data.title || "",
        description: data.description || "",
        price: data.price || 0,
        category: data.category || "",
        sellerId: data.sellerId as AndrewID,
        images: data.images || [],
        createdAt: data.createdAt || Date.now(),
        status: itemType === "marketplace" ? data.status : undefined,
        condition: itemType === "marketplace" ? data.condition : undefined,
        isAvailable: itemType === "commission" ? data.isAvailable : undefined,
        tags: data.tags || [],
        _relevanceScore: matchingTagsCount,
      };

      results.push(result);
    });

    return results
      .sort((a, b) => {
        if (b._relevanceScore !== a._relevanceScore) {
          return b._relevanceScore - a._relevanceScore;
        }
        return b.createdAt - a.createdAt;
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting similar items:", error);
    throw error;
  }
};
