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
import { MPITEM_STATUS } from "@/utils/ItemConstants";

// Combined search result type
export interface SearchResult {
  id: string;
  type: "marketplace" | "commission";
  title: string;
  description: string;
  price: number;
  category: string;
  sellerId: string;
  images: string[];
  createdAt: number;
  // Marketplace specific
  status?: string;
  condition?: string;
  // Commission specific
  turnaroundDays?: number;
  isAvailable?: boolean;
  tags: string[];
  // Include additional non-DB property for internal sorting
  _relevanceScore?: number;
}

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
  maxTurnaroundDays?: number;
  type?: string;
}

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

    // Only fetch marketplace items if no type specified or type is marketplace
    if (!filters.type || filters.type === "marketplace") {
      const mpItemsCollection = collection(db, "mpItems");
      const mpConstraints: QueryConstraint[] = [
        where("status", "==", MPITEM_STATUS.AVAILABLE),
        orderBy("createdAt", "desc"),
        firestoreLimit(itemLimit),
      ];

      const mpQuery = query(mpItemsCollection, ...mpConstraints);
      const mpSnapshot = await getDocs(mpQuery);

      // Process marketplace items
      mpSnapshot.forEach((doc) => {
        const data = doc.data();

        // Check if item matches search query (in title, description, or tags)
        const matchesSearch =
          data.title?.toLowerCase().includes(searchQueryLower) ||
          data.description?.toLowerCase().includes(searchQueryLower) ||
          data.tags?.some((tag: string) =>
            tag.toLowerCase().includes(searchQueryLower)
          );

        // Apply filters
        const matchesFilters =
          (!filters.category || data.category === filters.category) &&
          (typeof filters.minPrice !== "number" ||
            data.price >= filters.minPrice) &&
          (typeof filters.maxPrice !== "number" ||
            data.price <= filters.maxPrice) &&
          (!filters.condition || data.condition === filters.condition);

        if (matchesSearch && matchesFilters) {
          results.push({
            id: doc.id,
            type: "marketplace",
            title: data.title || "",
            description: data.description || "",
            price: data.price || 0,
            category: data.category || "",
            sellerId: data.sellerId || "",
            images: data.images || [],
            status: data.status || "",
            condition: data.condition || "",
            createdAt: data.createdAt || Date.now(),
            tags: data.tags || [],
          });
        }
      });
    }

    // Only fetch commission items if no type specified or type is commission
    if (!filters.type || filters.type === "commission") {
      const commItemsCollection = collection(db, "commItems");
      const commConstraints: QueryConstraint[] = [
        where("isAvailable", "==", true),
        orderBy("createdAt", "desc"),
        firestoreLimit(itemLimit),
      ];

      const commQuery = query(commItemsCollection, ...commConstraints);
      const commSnapshot = await getDocs(commQuery);

      // Process commission items
      commSnapshot.forEach((doc) => {
        const data = doc.data();

        // Check if item matches search query
        const matchesSearch =
          data.title?.toLowerCase().includes(searchQueryLower) ||
          data.description?.toLowerCase().includes(searchQueryLower) ||
          data.tags?.some((tag: string) =>
            tag.toLowerCase().includes(searchQueryLower)
          );

        // Apply filters
        const matchesFilters =
          (!filters.category || data.category === filters.category) &&
          (typeof filters.minPrice !== "number" ||
            data.price >= filters.minPrice) &&
          (typeof filters.maxPrice !== "number" ||
            data.price <= filters.maxPrice) &&
          (typeof filters.maxTurnaroundDays !== "number" ||
            data.turnaroundDays <= filters.maxTurnaroundDays);

        if (matchesSearch && matchesFilters) {
          results.push({
            id: doc.id,
            type: "commission",
            title: data.title || "",
            description: data.description || "",
            price: data.price || 0,
            category: data.category || "",
            sellerId: data.sellerId || "",
            images: data.images || [],
            turnaroundDays: data.turnaroundDays || 0,
            isAvailable: data.isAvailable || false,
            createdAt: data.createdAt || Date.now(),
            tags: data.tags || [],
          });
        }
      });
    }

    // Sort results by most recent first
    return results.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error searching items:", error);
    throw error;
  }
};

export const filterSearchResults = (
  results: SearchResult[],
  filters: SearchFilters
): SearchResult[] => {
  return results.filter((item) => {
    // Apply type filter
    if (filters.type && item.type !== filters.type) {
      return false;
    }

    // Apply price filters
    if (typeof filters.minPrice === "number" && item.price < filters.minPrice) {
      return false;
    }

    if (typeof filters.maxPrice === "number" && item.price > filters.maxPrice) {
      return false;
    }

    // Apply category filter
    if (filters.category && item.category !== filters.category) {
      return false;
    }

    // Apply condition filter (marketplace only)
    if (
      filters.condition &&
      item.type === "marketplace" &&
      item.condition !== filters.condition
    ) {
      return false;
    }

    // Apply turnaround days filter (commission only)
    if (
      typeof filters.maxTurnaroundDays === "number" &&
      item.type === "commission" &&
      typeof item.turnaroundDays === "number" &&
      item.turnaroundDays > filters.maxTurnaroundDays
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
  itemId: string,
  itemType: "marketplace" | "commission",
  category: string,
  tags: string[],
  limit: number = 8
): Promise<SearchResult[]> => {
  try {
    // Get items of the same category
    let collectionName = itemType === "marketplace" ? "mpItems" : "commItems";
    const itemsCollection = collection(db, collectionName);

    const constraints: QueryConstraint[] = [
      where("category", "==", category),
      itemType === "marketplace"
        ? where("status", "==", MPITEM_STATUS.AVAILABLE)
        : where("isAvailable", "==", true),
      orderBy("createdAt", "desc"),
      firestoreLimit(20), // Get more than needed to filter by relevance
    ];

    const itemsQuery = query(itemsCollection, ...constraints);
    const snapshot = await getDocs(itemsQuery);

    const results: Array<SearchResult & { _relevanceScore: number }> = [];

    snapshot.forEach((doc) => {
      // Skip the original item
      if (doc.id === itemId) return;

      const data = doc.data();

      // Calculate relevance score based on matching tags
      const itemTags = data.tags || [];
      const matchingTagsCount = itemTags.filter((tag: string) =>
        tags.includes(tag)
      ).length;

      const result: SearchResult & { _relevanceScore: number } = {
        id: doc.id,
        type: itemType,
        title: data.title || "",
        description: data.description || "",
        price: data.price || 0,
        category: data.category || "",
        sellerId: data.sellerId || "",
        images: data.images || [],
        createdAt: data.createdAt || Date.now(),
        status: itemType === "marketplace" ? data.status : undefined,
        condition: itemType === "marketplace" ? data.condition : undefined,
        turnaroundDays:
          itemType === "commission" ? data.turnaroundDays : undefined,
        isAvailable: itemType === "commission" ? data.isAvailable : undefined,
        tags: data.tags || [],
        _relevanceScore: matchingTagsCount,
      };

      results.push(result);
    });

    // Sort by relevance score (matching tags) first, then by recency
    return results
      .sort((a, b) => {
        // First sort by relevance score
        if (b._relevanceScore !== a._relevanceScore) {
          return b._relevanceScore - a._relevanceScore;
        }

        // If relevance scores are equal, sort by recency
        return b.createdAt - a.createdAt;
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting similar items:", error);
    throw error;
  }
};
