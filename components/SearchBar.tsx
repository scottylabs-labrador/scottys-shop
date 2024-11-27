"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="
          w-full
          py-2
          pl-10
          pr-4
          bg-white
          rounded-full
          border
          border-gray-300
          focus:outline-none
          focus:ring-2
          focus:ring-[#C41230]
          focus:border-transparent
          text-black
          placeholder:text-gray-500
          text-sm
          transition
          duration-200
        "
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
    </form>
  );
}
