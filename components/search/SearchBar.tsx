/**
 * Search bar component for site-wide searching
 * Provides real-time suggestions and search functionality
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { searchItems } from "@/firebase/searchService";
import { SearchResult } from "@/utils/types";
import Image from "next/image";
import { ITEM_TYPE } from "@/utils/ItemConstants";
import { formatPrice } from "@/utils/helpers";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle search input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.length >= 2) {
      setLoading(true);
      setShowResults(true);

      // Debounce search
      searchTimeout.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  // Perform search query
  const performSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) return;

    try {
      const searchResults = await searchItems(searchQuery, {}, 5); // Show only 5 results in dropdown
      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle item click
  const handleItemClick = (item: SearchResult) => {
    const itemType =
      item.type === "marketplace"
        ? ITEM_TYPE.MARKETPLACE.toLowerCase()
        : ITEM_TYPE.COMMISSION.toLowerCase();
    router.push(`/item/${itemType}/${item.id}`);
    setShowResults(false);
    setQuery("");
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
    }
  };

  // Clear search input
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            placeholder="Search for items, commissions, and more..."
            className="w-full pl-10 pr-10 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C41230] focus:border-transparent font-rubik"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="flex justify-center items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="font-rubik">Searching...</span>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="py-2 px-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700 font-rubik">
                  Showing top {results.length} result
                  {results.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ul>
                {results.map((item) => (
                  <li
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center p-3 border-b border-gray-100">
                      <div className="h-14 w-14 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {item.images && item.images.length > 0 ? (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-xs text-gray-500 font-rubik">
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1 font-rubik">
                          {item.title}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span className="capitalize font-rubik">
                            {item.category}
                          </span>
                          <span className="mx-1">•</span>
                          <span className="font-rubik">
                            {formatPrice(item.price)}
                          </span>
                          <span className="mx-1">•</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-xs font-rubik ${
                              item.type === "marketplace"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {item.type === "marketplace"
                              ? "marketplace"
                              : "commission"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={handleSubmit}
                  className="w-full p-2 text-sm text-center text-gray-700 hover:bg-gray-100 rounded-md font-rubik"
                >
                  View all results for &quot;{query}&quot;
                </button>
              </div>
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500 font-rubik">
              <p>No results found for &quot;{query}&quot;</p>
              <button
                onClick={handleSubmit}
                className="mt-2 text-sm text-[#C41230] hover:underline"
              >
                View all search results
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
