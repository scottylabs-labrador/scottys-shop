/**
 * Main header/navigation component
 * Provides site navigation, search, and user account access
 * All components are located in /nav/header
 */
"use client";

import { useState, useEffect } from "react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { FaBars } from "react-icons/fa";
import { MdOutlinePerson } from "react-icons/md";
import { Search, X, Heart, ShoppingCart, MessageCircle } from "lucide-react";
import ProfileDropdown from "@/components/nav/header/ProfileDropdown";
import SearchBar from "@/components/search/SearchBar";
import { User } from "@/utils/types";
import { ShopIcon } from "@/components/utils/ShopIcon";

// Navigation items for header menu
const NAVIGATION_ITEMS = ["commissions", "marketplace", "requests"];

// Reusable navigation link component
interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavigationLink = ({
  href,
  children,
  className = "",
  onClick,
}: NavigationLinkProps) => (
  <Link
    href={href}
    className={`text-black font-rubik font-semibold relative pb-1 group ${className}`}
    onClick={onClick}
  >
    {children}
    <div className="absolute bottom-[-10px] left-0 w-full h-[3] bg-black transform scale-x-0 group-hover:scale-x-100" />
  </Link>
);

// Reusable icon button component
interface IconButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  title?: string;
  className?: string;
}

const IconButton = ({
  icon: Icon,
  onClick,
  title,
  className = "p-2 hover:bg-gray-100 rounded-full",
}: IconButtonProps) => (
  <button type="button" className={className} onClick={onClick} title={title}>
    <Icon className="w-6 h-6 hover:text-black" />
  </button>
);

// Mobile menu component
const MobileMenu = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
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
              className="text-black font-rubik font-semibold p-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Messages
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

// Mobile search overlay
const MobileSearch = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
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

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useClerk();
  const [userData, setUserData] = useState<User | null>(null);

  // Fetch user data via secure API
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch("/api/users/current", { method: "POST" });
        if (response.ok) {
          const userData: User = await response.json();
          setUserData(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user?.id]);

  return (
    <nav className="border-b py-3 sticky top-0 bg-white z-50 font-rubik">
      <div className="max-w-8xl mx-auto px-7 flex items-center justify-between gap-4">
        {/* Left Side */}
        <div className="flex items-center gap-8 flex-shrink-0">
          <div className="flex items-center gap-4 lg:hidden">
            <IconButton
              icon={FaBars}
              onClick={() => setSidebarOpen(true)}
              title="Menu"
              className="p-2 text-black hover:text-black rounded-full hover:bg-gray-100"
            />
            <IconButton
              icon={Search}
              onClick={() => setSearchOpen(true)}
              title="Search"
              className="p-2 text-black hover:text-black rounded-full hover:bg-gray-100"
            />
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image
                src="/assets/logo.png"
                alt="Scotty's Shop"
                width={65}
                height={65}
                className="object-contain"
                priority
              />
            </Link>

            <div className="flex items-center gap-6 pr-3">
              {NAVIGATION_ITEMS.map((item) => (
                <NavigationLink
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="relative text-sm whitespace-nowrap font-rubik"
                >
                  {item}
                </NavigationLink>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Logo */}
        <div className="lg:hidden flex-shrink-0">
          <Link href="/">
            <Image
              src="/assets/logo.png"
              alt="Scotty's Shop"
              width={45}
              height={45}
              className="object-contain"
              priority
            />
          </Link>
        </div>

        {/* Center Search - Desktop */}
        <div className="hidden lg:block flex-1">
          <SearchBar />
        </div>

        {/* Right Side - Desktop Shows Icons */}
        <div className="flex items-center justify-end gap-4 flex-shrink-0">
          <SignedOut>
            <div className="pl-[150px] ">
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full group">
                  <MdOutlinePerson className="w-6 h-6" />
                  <span className="text-sm font-rubik font-medium group-hover:text-black hidden lg:inline">
                    Sign in
                  </span>
                </button>
              </SignInButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/favorites"
                title="Favorites"
                className="p-2 hover:bg-gray-100 rounded-full group"
              >
                <Heart className="w-6 h-6 group-hover:text-black" />
              </Link>
              <Link
                href="/conversations"
                title="Conversations"
                className="p-2 hover:bg-gray-100 rounded-full group"
              >
                <MessageCircle className="w-6 h-6 group-hover:text-black" />
              </Link>
              {/* Custom Store Icon */}
              <Link
                href={`/dashboard`}
                title="My Shop"
                className="p-2 hover:bg-gray-100 rounded-full group"
              >
                <ShopIcon />
              </Link>
              <ProfileDropdown />
              <Link
                href="/cart"
                title="Shopping Cart"
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ShoppingCart className="w-6 h-6 hover:text-black" />
              </Link>
            </div>
            <div className="lg:hidden">
              <ProfileDropdown />
            </div>
          </SignedIn>
        </div>
      </div>

      <MobileMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MobileSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
};

export default Header;
