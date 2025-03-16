"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  searchItems,
  filterSearchResults,
  type SearchResult,
} from "@/firebase/searchService";
import ItemCard from "@/components/items/itemcard/ItemCard";
import { ItemFilter } from "@/components/items/ItemFilter";
import { ITEM_TYPE } from "@/utils/ItemConstants";
import Loading from "@/components/utils/Loading";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState("all");

  const [results, setResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState({
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
    category: searchParams.get("category") || undefined,
    condition: searchParams.get("condition") || undefined,
    maxTurnaroundDays: searchParams.get("maxTurnaroundDays")
      ? Number(searchParams.get("maxTurnaroundDays"))
      : undefined,
    type: searchParams.get("type") || undefined,
  });

  // Fetch search results when query changes or on initial load
  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setFilteredResults([]);
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await searchItems(query);
        setResults(searchResults);

        // Apply additional filters client-side (for first load from URL params)
        if (
          initialLoad &&
          Object.values(filters).some((val) => val !== undefined)
        ) {
          const filtered = filterSearchResults(searchResults, filters);
          setFilteredResults(filtered);
        } else {
          setFilteredResults(searchResults);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        setResults([]);
        setFilteredResults([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchResults();
  }, [query]);

  // Filter results based on active tab
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredResults(results);
    } else if (activeTab === "marketplace") {
      setFilteredResults(results.filter((item) => item.type === "marketplace"));
    } else if (activeTab === "commission") {
      setFilteredResults(results.filter((item) => item.type === "commission"));
    }
  }, [results, activeTab]);

  // Apply filters when filters change
  useEffect(() => {
    if (!initialLoad) {
      const filtered = filterSearchResults(
        activeTab === "all"
          ? results
          : results.filter((item) => item.type === activeTab),
        filters
      );
      setFilteredResults(filtered);
    }
  }, [filters, activeTab, initialLoad]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Update URL
    const params = new URLSearchParams(searchParams);
    if (value !== "all") {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    router.push(`/search?${params.toString()}`);

    // Apply filter based on tab
    if (value === "all") {
      setFilteredResults(filterSearchResults(results, filters));
    } else {
      setFilteredResults(
        filterSearchResults(
          results.filter((item) => item.type === value),
          filters
        )
      );
    }
  };

  // Update URL and state when filters change
  const handleFilterChange = (newFilters: any) => {
    const params = new URLSearchParams();

    // Preserve search query
    if (query) params.set("q", query);

    // Set new filter params
    if (newFilters.minPrice !== undefined)
      params.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice !== undefined)
      params.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.condition) params.set("condition", newFilters.condition);
    if (
      newFilters.maxTurnaroundDays !== undefined &&
      newFilters.maxTurnaroundDays < 30
    )
      params.set("maxTurnaroundDays", newFilters.maxTurnaroundDays.toString());
    if (activeTab !== "all") params.set("type", activeTab);

    router.push(`/search?${params.toString()}`);
    setFilters(newFilters);
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-16 w-16 text-gray-300 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-1 font-rubik">
        No results found
      </h3>
      <p className="text-gray-500 max-w-md font-rubik">
        We couldn't find any items matching "{query}"
        {Object.values(filters).some((val) => val !== undefined)
          ? " with the selected filters"
          : ""}
        . Try adjusting your search terms or filters.
      </p>
    </div>
  );

  // Count results by type
  const marketplaceCount = results.filter(
    (item) => item.type === "marketplace"
  ).length;
  const commissionCount = results.filter(
    (item) => item.type === "commission"
  ).length;

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 font-rubik">
          {query ? `Search results for "${query}"` : "Search"}
        </h1>
        {results.length > 0 && (
          <p className="text-gray-500 font-rubik">
            Found {results.length} {results.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <ItemFilter
          onFilterChange={handleFilterChange}
          isMarketplace={activeTab === "marketplace"}
          isCommission={activeTab === "commission"}
          isSearch={true}
          initialFilters={filters}
        />
      </div>

      {/* Custom Tabs (styled like in SellerDashboard) */}
      <div className="mb-6">
        <div className="flex space-x-8 text-left font-rubik font-semibold">
          <button
            onClick={() => handleTabChange("all")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
              activeTab === "all"
                ? "border-blue-500 text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            All Items ({results.length})
          </button>
          <button
            onClick={() => handleTabChange("marketplace")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
              activeTab === "marketplace"
                ? "border-blue-500 text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Marketplace ({marketplaceCount})
          </button>
          <button
            onClick={() => handleTabChange("commission")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
              activeTab === "commission"
                ? "border-blue-500 text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Commissions ({commissionCount})
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "all" && (
            <>
              {filteredResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredResults.map((item) => (
                    <ItemCard
                      key={`${item.type}-${item.id}`}
                      itemId={item.id}
                      type={
                        item.type === "marketplace"
                          ? ITEM_TYPE.MARKETPLACE
                          : ITEM_TYPE.COMMISSION
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </>
          )}

          {activeTab === "marketplace" && (
            <>
              {filteredResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredResults.map((item) => (
                    <ItemCard
                      key={`${item.type}-${item.id}`}
                      itemId={item.id}
                      type={ITEM_TYPE.MARKETPLACE}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </>
          )}

          {activeTab === "commission" && (
            <>
              {filteredResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredResults.map((item) => (
                    <ItemCard
                      key={`${item.type}-${item.id}`}
                      itemId={item.id}
                      type={ITEM_TYPE.COMMISSION}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
