/**
 * Main header/navigation component
 * Provides site navigation, search, and user account access
 */
"use client";

import { useState, useEffect } from "react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { FaBars } from "react-icons/fa";
import { MdOutlinePerson } from "react-icons/md";
import {
  Search,
  X,
  LogOut,
  Heart,
  ShoppingCart,
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
import SearchBar from "@/components/search/SearchBar";
import { getUserByClerkId, type UserWithId } from "@/firebase/users";

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

// Profile dropdown with user options
const CustomProfileDropdown = () => {
  const { signOut, user } = useClerk();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserWithId | null>(null);

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const fbUser = await getUserByClerkId(user.id);
        if (fbUser) {
          setUserData(fbUser);
          setAvatarUrl(fbUser.avatarUrl || user.imageUrl || null);
        } else {
          setAvatarUrl(user.imageUrl || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setAvatarUrl(user.imageUrl || null);
      }
    };

    fetchUserData();
  }, [user?.id, user?.imageUrl]);

  // Dropdown menu items configuration
  const dropdownItems = [
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
              className="object-cover"
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
  const { user } = useClerk();
  const [userData, setUserData] = useState<UserWithId | null>(null);

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const fbUser = await getUserByClerkId(user.id);
        if (fbUser) {
          setUserData(fbUser);
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
                className="p-2 hover:bg-gray-100 rounded-full group"
              >
                <Heart className="w-6 h-6 group-hover:text-[#C41230]" />
              </Link>
              <Link
                href="/conversations"
                title="Conversations"
                className="p-2 hover:bg-gray-100 rounded-full group"
              >
                <MessageCircle className="w-6 h-6 group-hover:text-[#C41230]" />
              </Link>
              {/* Custom Store Icon */}
              <Link
                href={`/dashboard`}
                title="My Shop"
                className="p-2 hover:bg-gray-100 rounded-full group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="-0.75 -0.75 21 21"
                  height="25"
                  width="25"
                  className="group-hover:text-[#C41230]"
                >
                  <g>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.0892857142857144 11.839285714285714V18.107142857142858c0 0.18469285714285713 0.07337571428571428 0.36186428571428564 0.20398392857142855 0.49251428571428574 0.1305942857142857 0.13051071428571429 0.3077378571428571 0.20391428571428571 0.4924446428571428 0.20391428571428571h13.928571428571427c0.18469285714285713 0 0.36186428571428564 -0.07340357142857142 0.49251428571428574 -0.20391428571428571 0.13051071428571429 -0.13065 0.20391428571428571 -0.3078214285714286 0.20391428571428571 -0.49251428571428574V11.839285714285714"
                      strokeWidth="1.5"
                    ></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.142857142857142 11.839285714285714v6.9642857142857135"
                      strokeWidth="1.5"
                    ></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.0892857142857144 13.928571428571427H11.142857142857142"
                      strokeWidth="1.5"
                    ></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M0.6964285714285714 5.571428571428571 2.7857142857142856 0.6964285714285714h13.928571428571427L18.803571428571427 5.571428571428571H0.6964285714285714Z"
                      strokeWidth="1.5"
                    ></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.657857142857143 5.571428571428571v1.3928571428571428c0 0.7388132142857142 -0.29348892857142855 1.4473735714285714 -0.8159217857142858 1.9697924999999998C5.319516428571428 9.45651107142857 4.610956071428571 9.75 3.872142857142857 9.75H3.4821428571428568c-0.7388132142857142 0 -1.4473735714285714 -0.29348892857142855 -1.9697924999999998 -0.8159217857142858C0.9899230714285713 8.411659285714284 0.6964285714285714 7.703098928571428 0.6964285714285714 6.9642857142857135V5.571428571428571"
                      strokeWidth="1.5"
                    ></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12.883928571428571 5.571428571428571v1.3928571428571428c0 0.7388132142857142 -0.29348892857142855 1.4473735714285714 -0.8159217857142858 1.9697924999999998C11.545587857142856 9.45651107142857 10.8370275 9.75 10.098214285714285 9.75h-0.6964285714285714c-0.7388132142857142 0 -1.4473735714285714 -0.29348892857142855 -1.9697924999999998 -0.8159217857142858C6.9095603571428565 8.411659285714284 6.616071428571428 7.703098928571428 6.616071428571428 6.9642857142857135V5.571428571428571"
                      strokeWidth="1.5"
                    ></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.803571428571427 5.571428571428571v1.3928571428571428c0 0.7388132142857142 -0.293475 1.4473735714285714 -0.8159357142857142 1.9697924999999998C17.465175 9.45651107142857 16.75662857142857 9.75 16.017857142857142 9.75h-0.3482142857142857c-0.7387714285714285 0 -1.4473178571428569 -0.29348892857142855 -1.9697924999999998 -0.8159217857142858C13.1774175 8.411659285714284 12.883928571428571 7.703098928571428 12.883928571428571 6.9642857142857135V5.571428571428571"
                      strokeWidth="1.5"
                    ></path>
                  </g>
                </svg>
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
