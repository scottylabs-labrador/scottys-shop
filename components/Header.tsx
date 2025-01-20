"use client";

import { useState, useEffect } from "react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FaBars } from "react-icons/fa";
import { MdOutlinePerson } from "react-icons/md";
import {
  Search,
  X,
  LogOut,
  Heart,
  ShoppingCart,
  Store,
  LayoutDashboardIcon,
  History,
  Settings,
  MessageCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchBar from "./SearchBar";

// Navigation items for header menu
const NAVIGATION_ITEMS = ["Commissions", "Marketplace", "Requests"];

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
    <div className="absolute bottom-[-10px] left-0 w-full h-[3] bg-[#C41230] transform scale-x-0 group-hover:scale-x-100" />
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
    <Icon className="w-6 h-6 hover:text-[#C41230]" />
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
              href="/messages"
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

// Profile dropdown with user options
const CustomProfileDropdown = () => {
  const { signOut, user } = useClerk();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const userData = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id || "",
  });
  const getFileUrl = useMutation(api.files.getUrl);

  // Fetch and set user avatar URL
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (!userData || !user?.id) return;

      try {
        if (userData.avatarUrl) {
          if (userData.avatarUrl.startsWith("http")) {
            setAvatarUrl(userData.avatarUrl);
          } else {
            const url = await getFileUrl({
              storageId: userData.avatarUrl,
              userId: user.id,
            });
            setAvatarUrl(url);
          }
        } else if (user.imageUrl) {
          setAvatarUrl(user.imageUrl);
        }
      } catch (error) {
        console.error("Error fetching avatar URL:", error);
        if (user.imageUrl) {
          setAvatarUrl(user.imageUrl);
        }
      }
    };

    fetchAvatarUrl();
  }, [userData, user?.id, user?.imageUrl, getFileUrl]);

  // Dropdown menu items configuration
  const dropdownItems = [
    {
      href: `/shop/${userData?.andrewId}`,
      icon: Store,
      label: "View Profile",
      className:
        "p-4 font-rubik focus:bg-gray-100 cursor-pointer bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-[#C41230]",
    },
    {
      href: "/account",
      icon: Settings,
      label: "Manage Account",
      className: "p-4 font-rubik focus:bg-gray-100 cursor-pointer",
    },
    {
      href: "/purchases",
      icon: History,
      label: "Purchase History",
      className: "p-4 font-rubik focus:bg-gray-100 cursor-pointer",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none cursor-pointer transition-transform hover:scale-105">
          <Avatar className="h-8 w-8 transition-shadow hover:shadow-lg border-2 border-black">
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
        {dropdownItems.map(({ href, icon: Icon, label, className }) => (
          <DropdownMenuItem key={href} asChild className={className}>
            <Link href={href} className="flex items-center w-full">
              <Icon className="mr-3 h-7 w-7" />
              <span className="text-sm font-rubik">{label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => signOut()}
          className="p-4 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
        >
          <LogOut className="mr-3 h-7 w-7" />
          <span className="text-sm font-rubik">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
              className="p-2 text-black hover:text-[#C41230] rounded-full hover:bg-gray-100"
            />
            <IconButton
              icon={Search}
              onClick={() => setSearchOpen(true)}
              title="Search"
              className="p-2 text-black hover:text-[#C41230] rounded-full hover:bg-gray-100"
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
              />
            </Link>

            <div className="flex items-center gap-6">
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
                  <span className="text-sm font-rubik font-medium group-hover:text-[#C41230] hidden lg:inline">
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
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Heart className="w-6 h-6 hover:text-[#C41230]" />
              </Link>
              <Link
                href="/messages"
                title="Messages"
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <MessageCircle className="w-6 h-6 hover:text-[#C41230]" />
              </Link>
              <Link
                href="/dashboard"
                title="My Shop"
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <LayoutDashboardIcon className="w-6 h-6 hover:text-[#C41230]" />
              </Link>
              <CustomProfileDropdown />
              <Link
                href="/cart"
                title="Shopping Cart"
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ShoppingCart className="w-6 h-6 hover:text-[#C41230]" />
              </Link>
            </div>
            <div className="lg:hidden">
              <CustomProfileDropdown />
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
