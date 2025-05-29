/**
 * MobileSearch component
 * Mobile search overlay that appears when toggled
 */
"use client";

import React from "react";
import { X } from "lucide-react";
import SearchBar from "@/components/search/SearchBar";
import IconButton from "./IconButton";

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSearch = ({ isOpen, onClose }: MobileSearchProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white p-4">
      <div className="flex items-center gap-4 mb-4">
        <IconButton icon={X} onClick={onClose} title="Close" />
        <div className="flex-1">
          <SearchBar />
        </div>
      </div>
    </div>
  );
};

export default MobileSearch;
