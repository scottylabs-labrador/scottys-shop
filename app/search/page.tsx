// app/search/page.tsx
import SearchResultsPage from "@/components/search/SearchResultsPage";

export const metadata = {
  title: "Search Results - Scotty's Shop",
  description: "Search for marketplace items and commissions on Scotty's Shop",
};

export default function SearchPage() {
  return <SearchResultsPage />;
}
