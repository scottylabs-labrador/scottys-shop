import { NextRequest, NextResponse } from "next/server";
import { searchItems, type SearchFilters } from "@/firebase/searchService";

export async function GET(request: NextRequest) {
  try {
    // Get search parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    // Extract filters
    const filters: SearchFilters = {
      minPrice: searchParams.has("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.has("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      category: searchParams.get("category") || undefined,
      condition: searchParams.get("condition") || undefined,
      maxTurnaroundDays: searchParams.has("maxTurnaroundDays")
        ? Number(searchParams.get("maxTurnaroundDays"))
        : undefined,
      type: searchParams.get("type") || undefined,
    };

    // Get limit parameter (default to 40 if not provided)
    const limit = searchParams.has("limit")
      ? Number(searchParams.get("limit"))
      : 40;

    // Validate query
    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          error: "Search query must be at least 2 characters long",
        },
        { status: 400 }
      );
    }

    // Execute search
    const results = await searchItems(query, filters, limit);

    // Return results
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        error: "An error occurred while searching",
      },
      { status: 500 }
    );
  }
}
