/**
 * MobileMenu component
 * Mobile navigation sidebar that appears when toggled
 */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { SignedIn } from "@clerk/nextjs";
import IconButton from "./IconButton";

// Navigation items for menu
const NAVIGATION_ITEMS = ["commissions", "marketplace", "requests"];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

const MobileMenu = ({ isOpen, onClose, unreadCount }: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed top-0 left-0 bottom-0 w-72 bg-white p-6 space-y-6 shadow-xl overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <Image
            src="/assets/logo.png"
            alt="Scotty's Shop"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
          <IconButton icon={X} onClick={onClose} title="Close" />
        </div>
        <div className="flex flex-col space-y-4">
          {NAVIGATION_ITEMS.map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase()}`}
              className="text-black font-rubik font-semibold p-3 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={onClose}
            >
              {item}
            </Link>
          ))}
          <SignedIn>
            <Link
              href="/favorites"
              className="text-black font-rubik font-semibold p-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Favorites
            </Link>
            <Link
              href="/conversations"
              className="text-black font-rubik font-semibold p-3 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
            >
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="bg-[#C41230] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard"
              className="text-black font-rubik font-semibold p-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Seller Dashboard
            </Link>
            <Link
              href="/cart"
              className="text-black font-rubik font-semibold p-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Shopping Cart
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
