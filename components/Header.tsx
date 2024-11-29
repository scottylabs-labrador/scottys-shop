"use client";

import { useState, useEffect } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { FaInbox, FaBars } from "react-icons/fa";
import { MdOutlinePerson } from "react-icons/md";
import { Search, X, Store, LogOut } from "lucide-react";
import SearchBar from "./SearchBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClerk } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { signOut } = useClerk();

  return (
    <nav className="border-b py-4 px-8 relative sticky top-0 bg-white">
      <div className="flex items-center justify-between w-full">
        {/* Left Side */}
        <div className="flex items-center">
          {/* Mobile Menu/Search */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="p-1 text-black hover:text-[#C41230]"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FaBars className="w-6 h-6" />
            </button>
            <button
              type="button"
              className="ml-3 p-1 text-black hover:text-[#C41230]"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop Logo and Nav */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/logo.png"
                alt="logo"
                width={70}
                height={70}
                className="object-contain"
              />
            </Link>

            <div className="flex items-center space-x-8">
              {["Marketplace", "Commissions", "Requests"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="relative text-base text-black font-medium group"
                >
                  <span className="relative z-10 font-bold">{item}</span>
                  <span className="absolute inset-x-0 bottom-[-2px] h-0.5 bg-[#C41230] transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2 lg:hidden">
          <Link href="/">
            <Image
              src="/assets/logo.png"
              alt="logo"
              width={70}
              height={70}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center">
          {/* Mobile Actions */}
          <div className="flex items-center lg:hidden space-x-3">
            <SignedIn>
              <Link href="/inbox" title="Inbox">
                <FaInbox className="w-8 h-8 hover:text-[#C41230]" />
              </Link>
              <CustomProfileDropdown />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center p-1 group">
                  <MdOutlinePerson className="w-6 h-6" />
                  <span className="text-sm font-bold relative">
                    Sign in
                    <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-current scale-x-0 transition-transform group-hover:scale-x-100" />
                  </span>
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="w-96">
              <SearchBar />
            </div>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center space-x-2 group">
                  <MdOutlinePerson className="w-6 h-6" />
                  <span className="font-bold relative">
                    Sign in
                    <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-current scale-x-0 transition-transform group-hover:scale-x-100" />
                  </span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/inbox" title="Inbox">
                <FaInbox className="w-8 h-8 hover:text-[#C41230]" />
              </Link>
              <CustomProfileDropdown />
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-white p-8 space-y-4">
            {["Marketplace", "Commissions", "Requests"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="block text-base font-bold hover:text-[#C41230]"
                onClick={() => setSidebarOpen(false)}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Search */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white p-4">
          <button
            className="ml-auto block mb-4 hover:text-[#C41230]"
            onClick={() => setSearchOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <SearchBar />
        </div>
      )}
    </nav>
  );
};

function CustomProfileDropdown() {
  const { signOut, user } = useClerk();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Get user data from Convex
  const userData = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id || "",
  });

  // Get the getUrl mutation
  const getFileUrl = useMutation(api.files.getUrl);

  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (!userData || !user?.id) return;

      try {
        if (userData.avatarUrl) {
          // If it's already a URL (from Clerk), use it directly
          if (userData.avatarUrl.startsWith("http")) {
            setAvatarUrl(userData.avatarUrl);
          } else {
            // Otherwise, fetch it from Convex storage
            const url = await getFileUrl({
              storageId: userData.avatarUrl,
              userId: user.id,
            });
            setAvatarUrl(url);
          }
        } else if (user.imageUrl) {
          // Fallback to Clerk avatar if no custom avatar
          setAvatarUrl(user.imageUrl);
        }
      } catch (error) {
        console.error("Error fetching avatar URL:", error);
        // Fallback to Clerk avatar on error
        if (user.imageUrl) {
          setAvatarUrl(user.imageUrl);
        }
      }
    };

    fetchAvatarUrl();
  }, [userData, user?.id, user?.imageUrl, getFileUrl]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none cursor-pointer">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={avatarUrl || "/assets/default-avatar.jpg"}
              alt={user?.firstName || "User"}
            />
            <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60 p-3"
        style={{ zIndex: 1000 }}
      >
        <DropdownMenuItem
          asChild
          className="p-4 focus:bg-gray-100 cursor-pointer"
        >
          <Link
            href={`/shop/${userData?.andrewId}`}
            className="flex items-center w-full"
          >
            <Store className="mr-3 h-7 w-7" />
            <span className="text-base font-bold">Manage Shop</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => signOut()}
          className="p-4 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
        >
          <LogOut className="mr-3 h-7 w-7" />
          <span className="text-base font-bold">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default Header;
